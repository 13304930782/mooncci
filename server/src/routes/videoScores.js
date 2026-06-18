const express = require('express');
const router = express.Router();
const db = require('../db');

let authRequired = (req, res, next) => next();
let adminOnly = (req, res, next) => next();

try {
  const auth = require('../middleware/auth');
  authRequired = auth.authRequired || authRequired;
  adminOnly = auth.adminOnly || adminOnly;
} catch (e) {
  console.warn('[videoScores] auth middleware not loaded, admin routes are not protected');
}

function toScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > 100) return null;
  return Math.round(n);
}

function clientIp(req) {
  return (
    req.headers['x-forwarded-for'] ||
    req.socket?.remoteAddress ||
    ''
  ).toString().split(',')[0].trim();
}

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS video_public_scores (
      id INT NOT NULL AUTO_INCREMENT,
      video_id INT NOT NULL,
      scorer_name VARCHAR(100) NULL,
      class_name VARCHAR(100) NULL,
      content_score TINYINT NOT NULL,
      presentation_score TINYINT NOT NULL,
      creativity_score TINYINT NOT NULL,
      teamwork_score TINYINT NOT NULL,
      total_score DECIMAL(6,2) NOT NULL DEFAULT 0,
      comment TEXT NULL,
      ip VARCHAR(80) NULL,
      user_agent VARCHAR(255) NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_video_public_scores_video_id (video_id),
      KEY idx_video_public_scores_total (total_score),
      KEY idx_video_public_scores_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

ensureTable().catch(err => {
  console.error('[videoScores] ensure table failed:', err);
});

router.post('/public/:videoId', async (req, res) => {
  try {
    await ensureTable();

    const videoId = Number(req.params.videoId);
    if (!Number.isInteger(videoId) || videoId <= 0) {
      return res.status(400).json({ message: '视频 ID 无效' });
    }

    const contentScore = toScore(req.body.contentScore);
    const presentationScore = toScore(req.body.presentationScore);
    const creativityScore = toScore(req.body.creativityScore);
    const teamworkScore = toScore(req.body.teamworkScore);

    if (
      contentScore === null ||
      presentationScore === null ||
      creativityScore === null ||
      teamworkScore === null
    ) {
      return res.status(400).json({ message: '评分必须是 0-100 的数字' });
    }

    const [[video]] = await db.query(
      'SELECT id FROM videos WHERE id = ? LIMIT 1',
      [videoId]
    );

    if (!video) {
      return res.status(404).json({ message: '视频不存在' });
    }

    const totalScore =
      contentScore * 0.35 +
      presentationScore * 0.25 +
      creativityScore * 0.20 +
      teamworkScore * 0.20;

    await db.query(
      `
      INSERT INTO video_public_scores
      (video_id, scorer_name, class_name, content_score, presentation_score, creativity_score, teamwork_score, total_score, comment, ip, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        videoId,
        req.body.scorerName || null,
        req.body.className || null,
        contentScore,
        presentationScore,
        creativityScore,
        teamworkScore,
        Number(totalScore.toFixed(2)),
        req.body.comment || null,
        clientIp(req),
        String(req.headers['user-agent'] || '').slice(0, 255),
      ]
    );

    res.json({
      message: '评分提交成功',
      totalScore: Number(totalScore.toFixed(2)),
    });
  } catch (err) {
    console.error('[videoScores/public] failed:', err);
    res.status(500).json({ message: '评分提交失败' });
  }
});

router.get('/public/:videoId/summary', async (req, res) => {
  try {
    await ensureTable();

    const videoId = Number(req.params.videoId);
    if (!Number.isInteger(videoId) || videoId <= 0) {
      return res.status(400).json({ message: '视频 ID 无效' });
    }

    const [[summary]] = await db.query(
      `
      SELECT
        COUNT(*) AS scoreCount,
        ROUND(AVG(content_score), 2) AS avgContent,
        ROUND(AVG(presentation_score), 2) AS avgPresentation,
        ROUND(AVG(creativity_score), 2) AS avgCreativity,
        ROUND(AVG(teamwork_score), 2) AS avgTeamwork,
        ROUND(AVG(total_score), 2) AS avgTotal
      FROM video_public_scores
      WHERE video_id = ?
      `,
      [videoId]
    );

    res.json(summary || {});
  } catch (err) {
    console.error('[videoScores/summary] failed:', err);
    res.status(500).json({ message: '评分统计加载失败' });
  }
});

router.get('/admin/rankings', authRequired, adminOnly, async (req, res) => {
  try {
    await ensureTable();

    const [rows] = await db.query(`
      SELECT
        v.id AS videoId,
        v.title,
        v.team_name AS teamName,
        COUNT(s.id) AS scoreCount,
        ROUND(AVG(s.content_score), 2) AS avgContent,
        ROUND(AVG(s.presentation_score), 2) AS avgPresentation,
        ROUND(AVG(s.creativity_score), 2) AS avgCreativity,
        ROUND(AVG(s.teamwork_score), 2) AS avgTeamwork,
        ROUND(AVG(s.total_score), 2) AS avgTotal
      FROM videos v
      LEFT JOIN video_public_scores s ON s.video_id = v.id
      GROUP BY v.id
      ORDER BY avgTotal DESC, scoreCount DESC, v.id ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error('[videoScores/admin/rankings] failed:', err);
    res.status(500).json({ message: '排名加载失败' });
  }
});

router.get('/admin/export.csv', authRequired, adminOnly, async (req, res) => {
  try {
    await ensureTable();

    const [rows] = await db.query(`
      SELECT
        v.id AS video_id,
        v.title,
        v.team_name,
        s.scorer_name,
        s.class_name,
        s.content_score,
        s.presentation_score,
        s.creativity_score,
        s.teamwork_score,
        s.total_score,
        s.comment,
        s.created_at
      FROM video_public_scores s
      LEFT JOIN videos v ON v.id = s.video_id
      ORDER BY s.created_at DESC
    `);

    const header = [
      'video_id',
      'title',
      'team_name',
      'scorer_name',
      'class_name',
      'content_score',
      'presentation_score',
      'creativity_score',
      'teamwork_score',
      'total_score',
      'comment',
      'created_at',
    ];

    const escapeCsv = value => {
      if (value === null || value === undefined) return '';
      const text = String(value).replace(/"/g, '""');
      return `"${text}"`;
    };

    const csv = [
      header.join(','),
      ...rows.map(row => header.map(key => escapeCsv(row[key])).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="video_scores.csv"');
    res.send('\uFEFF' + csv);
  } catch (err) {
    console.error('[videoScores/admin/export] failed:', err);
    res.status(500).json({ message: '导出失败' });
  }
});

module.exports = router;
