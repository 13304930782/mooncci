const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  const isAdmin = req.query.admin === '1';
  const sql = isAdmin
    ? `SELECT p.*,u.username AS author_name FROM posts p JOIN users u ON u.id=p.author_id ORDER BY p.created_at DESC`
    : `SELECT p.*,u.username AS author_name FROM posts p JOIN users u ON u.id=p.author_id WHERE p.status='published' ORDER BY p.published_at DESC, p.created_at DESC`;
  const [rows] = await db.query(sql);
  res.json(rows);
});
router.get('/:id', async (req, res) => {
  const [rows] = await db.query('SELECT p.*,u.username AS author_name FROM posts p JOIN users u ON u.id=p.author_id WHERE p.id=?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: '不存在' });
  res.json(rows[0]);
});
router.post('/', authRequired, async (req, res) => {
  const p = req.body;
  const publishedAt = p.status === 'published' ? new Date() : null;
  await db.query('INSERT INTO posts (title,slug,summary,content,cover_image,category,tags,status,author_id,published_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [p.title, p.slug, p.summary, p.content, p.cover_image, p.category, JSON.stringify(p.tags || []), p.status || 'draft', req.user.id, publishedAt]);
  res.json({ message: '创建成功' });
});
router.put('/:id', authRequired, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM posts WHERE id=?', [req.params.id]);
  const old = rows[0]; if (!old) return res.status(404).json({ message: '不存在' });
  if (req.user.role !== 'admin' && old.author_id !== req.user.id) return res.status(403).json({ message: '无权限' });
  const p = req.body;
  const publishedAt = p.status === 'published' ? (old.published_at || new Date()) : null;
  await db.query('UPDATE posts SET title=?,slug=?,summary=?,content=?,cover_image=?,category=?,tags=?,status=?,published_at=? WHERE id=?',
    [p.title, p.slug, p.summary, p.content, p.cover_image, p.category, JSON.stringify(p.tags || []), p.status, publishedAt, req.params.id]);
  res.json({ message: '更新成功' });
});
router.delete('/:id', authRequired, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM posts WHERE id=?', [req.params.id]);
  const old = rows[0]; if (!old) return res.status(404).json({ message: '不存在' });
  if (req.user.role !== 'admin' && old.author_id !== req.user.id) return res.status(403).json({ message: '无权限' });
  await db.query('DELETE FROM posts WHERE id=?', [req.params.id]);
  res.json({ message: '删除成功' });
});

module.exports = router;
