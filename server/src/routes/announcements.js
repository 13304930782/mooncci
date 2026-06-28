const express = require('express');
const db = require('../db');
const { authRequired, adminOnly } = require('../middleware/auth');

const router = express.Router();

function cleanString(value, fallback = '', maxLength = 1000) {
  const next = value == null ? fallback : String(value);
  return next.trim().slice(0, maxLength);
}

function cleanStatus(value) {
  return ['draft', 'published', 'archived'].includes(value) ? value : 'draft';
}

function normalizeAnnouncement(input) {
  const source = input || {};
  const status = cleanStatus(source.status);

  return {
    title: cleanString(source.title, '', 160),
    content: cleanString(source.content, '', 2000),
    link_label: cleanString(source.link_label, '', 80),
    link_url: cleanString(source.link_url, '', 255),
    status,
    pinned: source.pinned ? 1 : 0,
  };
}

function publicRow(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    link_label: row.link_label || '',
    link_url: row.link_url || '',
    pinned: row.pinned ? 1 : 0,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

router.get('/', async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);

  try {
    const [rows] = await db.query(
      `
      SELECT id, title, content, link_label, link_url, pinned, published_at, created_at, updated_at
      FROM announcements
      WHERE status='published'
      ORDER BY pinned DESC, COALESCE(published_at, created_at) DESC, id DESC
      LIMIT ?
      `,
      [limit]
    );

    res.json(rows.map(publicRow));
  } catch (err) {
    if (err?.code === 'ER_NO_SUCH_TABLE') {
      return res.json([]);
    }

    throw err;
  }
});

router.get('/:id(\\d+)', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: '公告 ID 无效。' });
  }

  try {
    const [rows] = await db.query(
      `
      SELECT id, title, content, link_label, link_url, pinned, published_at, created_at, updated_at
      FROM announcements
      WHERE id=? AND status='published'
      LIMIT 1
      `,
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: '公告不存在。' });
    }

    res.json(publicRow(rows[0]));
  } catch (err) {
    if (err?.code === 'ER_NO_SUCH_TABLE') {
      return res.status(404).json({ message: '公告不存在。' });
    }

    throw err;
  }
});

router.get('/admin', authRequired, adminOnly, async (req, res) => {
  const status = cleanString(req.query.status, 'all', 20);
  const params = [];
  const where = [];

  if (status !== 'all') {
    where.push('status=?');
    params.push(cleanStatus(status));
  }

  const [rows] = await db.query(
    `
    SELECT
      id,
      title,
      content,
      link_label,
      link_url,
      status,
      pinned,
      published_at,
      created_at,
      updated_at
    FROM announcements
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY pinned DESC, COALESCE(published_at, created_at) DESC, id DESC
    LIMIT 200
    `,
    params
  );

  res.json(rows);
});

router.post('/admin', authRequired, adminOnly, async (req, res) => {
  const item = normalizeAnnouncement(req.body);

  if (!item.title || !item.content) {
    return res.status(400).json({ message: '公告标题和内容不能为空。' });
  }

  const publishedAtSql = item.status === 'published' ? 'NOW()' : 'NULL';
  const [result] = await db.query(
    `
    INSERT INTO announcements
    (title, content, link_label, link_url, status, pinned, published_at, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ${publishedAtSql}, ?, ?)
    `,
    [
      item.title,
      item.content,
      item.link_label || null,
      item.link_url || null,
      item.status,
      item.pinned,
      req.user.id,
      req.user.id,
    ]
  );

  res.json({ message: '公告已创建。', id: result.insertId });
});

router.put('/admin/:id', authRequired, adminOnly, async (req, res) => {
  const item = normalizeAnnouncement(req.body);

  if (!item.title || !item.content) {
    return res.status(400).json({ message: '公告标题和内容不能为空。' });
  }

  const [rows] = await db.query('SELECT id, status, published_at FROM announcements WHERE id=? LIMIT 1', [req.params.id]);

  if (!rows[0]) {
    return res.status(404).json({ message: '公告不存在。' });
  }

  const shouldSetPublishedAt = item.status === 'published' && !rows[0].published_at;

  await db.query(
    `
    UPDATE announcements
    SET
      title=?,
      content=?,
      link_label=?,
      link_url=?,
      status=?,
      pinned=?,
      published_at=${shouldSetPublishedAt ? 'NOW()' : 'published_at'},
      updated_by=?
    WHERE id=?
    `,
    [
      item.title,
      item.content,
      item.link_label || null,
      item.link_url || null,
      item.status,
      item.pinned,
      req.user.id,
      req.params.id,
    ]
  );

  res.json({ message: '公告已保存。' });
});

router.delete('/admin/:id', authRequired, adminOnly, async (req, res) => {
  const [result] = await db.query(
    'UPDATE announcements SET status="archived", pinned=0, updated_by=? WHERE id=?',
    [req.user.id, req.params.id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ message: '公告不存在。' });
  }

  res.json({ message: '公告已归档。' });
});

module.exports = router;
