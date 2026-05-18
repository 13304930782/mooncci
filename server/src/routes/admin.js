const express = require('express');
const db = require('../db');
const { authRequired, adminOnly } = require('../middleware/auth');
const router = express.Router();
router.use(authRequired, adminOnly);
router.get('/users', async (_req, res) => {
  const [rows] = await db.query('SELECT id,username,email,role,status,created_at FROM users ORDER BY id DESC');
  res.json(rows);
});
router.put('/users/:id', async (req, res) => {
  const { role, status } = req.body;
  await db.query('UPDATE users SET role=?, status=? WHERE id=?', [role, status, req.params.id]);
  res.json({ message: '更新成功' });
});
router.delete('/users/:id', async (req, res) => {
  await db.query('DELETE FROM users WHERE id=?', [req.params.id]);
  res.json({ message: '删除成功' });
});
router.get('/posts', async (_req, res) => {
  const [rows] = await db.query('SELECT p.*,u.username AS author_name FROM posts p JOIN users u ON u.id=p.author_id ORDER BY p.updated_at DESC');
  res.json(rows);
});
module.exports = router;
