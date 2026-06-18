const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { authRequired, adminOnly } = require('../middleware/auth');

const reportRouter = express.Router();
const router = express.Router();

const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Router monitor report rate limit exceeded.' },
});

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return number;
}

function intOrNull(value) {
  const number = numberOrNull(value);
  if (number === null) return null;
  return Math.max(0, Math.round(number));
}

function percent(value) {
  const number = numberOrNull(value);
  if (number === null) return null;
  return Math.min(100, Math.max(0, Number(number.toFixed(2))));
}

function usagePercent(used, total) {
  const usedNumber = numberOrNull(used);
  const totalNumber = numberOrNull(total);

  if (usedNumber === null || totalNumber === null || totalNumber <= 0) {
    return null;
  }

  return percent((usedNumber / totalNumber) * 100);
}

function maxPercent(values) {
  const valid = values.filter((value) => value !== null && value !== undefined);
  if (!valid.length) return null;
  return percent(Math.max(...valid));
}

function cleanDevice(value) {
  const device = String(value || 'main-router').trim();
  return device.slice(0, 100) || 'main-router';
}

function verifyRouterToken(req, res, next) {
  const expected = process.env.ROUTER_MONITOR_TOKEN;

  if (!expected || expected.length < 24) {
    return res.status(503).json({ message: 'Router monitor token is not configured.' });
  }

  const received = req.get('X-Router-Token') || '';

  if (received !== expected) {
    return res.status(401).json({ message: 'Invalid router monitor token.' });
  }

  next();
}

function normalizeMetricBody(body) {
  const conntrackCount = intOrNull(body.conntrack_count ?? body.count);
  const conntrackMax = intOrNull(body.conntrack_max ?? body.max);
  const conntrackUsage = usagePercent(conntrackCount, conntrackMax);

  const memoryTotal = intOrNull(body.memory_total_mb ?? body.mem_total_mb);
  const memoryUsed = intOrNull(body.memory_used_mb ?? body.mem_used_mb);
  const memoryFree = intOrNull(body.memory_free_mb ?? body.mem_free_mb);
  const memoryUsage = percent(body.memory_usage ?? body.mem_usage) ?? usagePercent(memoryUsed, memoryTotal);

  const diskTotal = intOrNull(body.disk_total_mb);
  const diskUsed = intOrNull(body.disk_used_mb);
  const diskFree = intOrNull(body.disk_free_mb);
  const diskUsage = percent(body.disk_usage) ?? usagePercent(diskUsed, diskTotal);

  const cpuUsage = percent(body.cpu_usage);

  return {
    device: cleanDevice(body.device),
    conntrackCount,
    conntrackMax,
    conntrackUsage,
    cpuUsage,
    loadOne: numberOrNull(body.load_one ?? body.load1),
    loadFive: numberOrNull(body.load_five ?? body.load5),
    loadFifteen: numberOrNull(body.load_fifteen ?? body.load15),
    memoryTotal,
    memoryUsed,
    memoryFree,
    memoryUsage,
    diskTotal,
    diskUsed,
    diskFree,
    diskUsage,
    uptimeSeconds: intOrNull(body.uptime_seconds ?? body.uptime),
    overallUsage: maxPercent([conntrackUsage, cpuUsage, memoryUsage]),
  };
}

function rowToMetric(row) {
  if (!row) return null;

  return {
    id: row.id,
    device: row.device,
    conntrack_count: row.conntrack_count,
    conntrack_max: row.conntrack_max,
    conntrack_usage: row.conntrack_usage === null ? null : Number(row.conntrack_usage),
    cpu_usage: row.cpu_usage === null ? null : Number(row.cpu_usage),
    load_one: row.load_one === null ? null : Number(row.load_one),
    load_five: row.load_five === null ? null : Number(row.load_five),
    load_fifteen: row.load_fifteen === null ? null : Number(row.load_fifteen),
    memory_total_mb: row.memory_total_mb,
    memory_used_mb: row.memory_used_mb,
    memory_free_mb: row.memory_free_mb,
    memory_usage: row.memory_usage === null ? null : Number(row.memory_usage),
    disk_total_mb: row.disk_total_mb,
    disk_used_mb: row.disk_used_mb,
    disk_free_mb: row.disk_free_mb,
    disk_usage: row.disk_usage === null ? null : Number(row.disk_usage),
    uptime_seconds: row.uptime_seconds === null ? null : Number(row.uptime_seconds),
    overall_usage: row.overall_usage === null ? null : Number(row.overall_usage),
    created_at: row.created_at,
  };
}

reportRouter.post('/', reportLimiter, verifyRouterToken, async (req, res) => {
  try {
    const metric = normalizeMetricBody(req.body || {});

    if (
      metric.conntrackCount === null &&
      metric.cpuUsage === null &&
      metric.memoryUsage === null &&
      metric.diskUsage === null
    ) {
      return res.status(400).json({ message: 'At least one router metric is required.' });
    }

    const [result] = await db.query(
      `
      INSERT INTO router_monitor_metrics
      (
        device,
        conntrack_count,
        conntrack_max,
        conntrack_usage,
        cpu_usage,
        load_one,
        load_five,
        load_fifteen,
        memory_total_mb,
        memory_used_mb,
        memory_free_mb,
        memory_usage,
        disk_total_mb,
        disk_used_mb,
        disk_free_mb,
        disk_usage,
        uptime_seconds,
        overall_usage
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        metric.device,
        metric.conntrackCount,
        metric.conntrackMax,
        metric.conntrackUsage,
        metric.cpuUsage,
        metric.loadOne,
        metric.loadFive,
        metric.loadFifteen,
        metric.memoryTotal,
        metric.memoryUsed,
        metric.memoryFree,
        metric.memoryUsage,
        metric.diskTotal,
        metric.diskUsed,
        metric.diskFree,
        metric.diskUsage,
        metric.uptimeSeconds,
        metric.overallUsage,
      ]
    );

    res.status(201).json({ ok: true, id: result.insertId, metric });
  } catch (err) {
    console.error('[router-monitor/report]', err);
    res.status(500).json({ message: 'Router monitor report failed.' });
  }
});

router.use(authRequired);
router.use(adminOnly);

router.get('/devices', async (_req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT m.*
      FROM router_monitor_metrics m
      JOIN (
        SELECT device, MAX(id) AS latest_id
        FROM router_monitor_metrics
        GROUP BY device
      ) latest ON latest.latest_id = m.id
      ORDER BY m.created_at DESC
      LIMIT 50
      `
    );

    res.json(rows.map(rowToMetric));
  } catch (err) {
    console.error('[router-monitor/devices]', err);
    res.status(500).json({ message: 'Router monitor devices load failed.' });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const device = cleanDevice(req.query.device);
    const [rows] = await db.query(
      `
      SELECT *
      FROM router_monitor_metrics
      WHERE device = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [device]
    );

    res.json({ metric: rowToMetric(rows[0]) });
  } catch (err) {
    console.error('[router-monitor/latest]', err);
    res.status(500).json({ message: 'Router monitor latest metric load failed.' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const device = cleanDevice(req.query.device);
    const hours = Math.min(168, Math.max(1, Number(req.query.hours || 24)));
    const limit = Math.min(1000, Math.max(10, Number(req.query.limit || 288)));

    const [rows] = await db.query(
      `
      SELECT *
      FROM router_monitor_metrics
      WHERE device = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
      ORDER BY created_at ASC
      LIMIT ?
      `,
      [device, hours, limit]
    );

    res.json(rows.map(rowToMetric));
  } catch (err) {
    console.error('[router-monitor/history]', err);
    res.status(500).json({ message: 'Router monitor history load failed.' });
  }
});

module.exports = {
  reportRouter,
  router,
};
