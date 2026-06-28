const express = require('express');
const db = require('../db');
const { authRequired, adminOnly } = require('../middleware/auth');

const router = express.Router();

async function ensureLegacyScoresTable() {
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

ensureLegacyScoresTable().catch((err) => {
  console.error('[videoScores] ensure legacy table failed:', err);
});

router.post('/public/:videoId', (_req, res) => {
  res.status(410).json({
    message: '旧版公共评分接口已停用，请使用 /api/videos/:id/public-score。',
  });
});

router.get('/public/:videoId/summary', async (req, res) => {
  try {
    await ensureLegacyScoresTable();

    const videoId = Number(req.params.videoId);
    if (!Number.isInteger(videoId) || videoId <= 0) {
      return res.status(400).json({ message: '视频 ID 无效。' });
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
    res.status(500).json({ message: '评分统计加载失败。' });
  }
});

router.get('/admin/rankings', authRequired, adminOnly, async (_req, res) => {
  try {
    await ensureLegacyScoresTable();

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
    res.status(500).json({ message: '排名加载失败。' });
  }
});

router.get('/admin/export.csv', authRequired, adminOnly, async (_req, res) => {
  try {
    await ensureLegacyScoresTable();

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

    const escapeCsv = (value) => {
      if (value === null || value === undefined) return '';
      return `"${String(value).replace(/"/g, '""')}"`;
    };

    const csv = [
      header.join(','),
      ...rows.map((row) => header.map((key) => escapeCsv(row[key])).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="legacy_video_scores.csv"');
    res.send(`\uFEFF${csv}`);
  } catch (err) {
    console.error('[videoScores/admin/export] failed:', err);
    res.status(500).json({ message: '导出失败。' });
  }
});

module.exports = router;
