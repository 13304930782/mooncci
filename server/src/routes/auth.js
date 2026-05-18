const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
const safeUser = (u) => ({ id: u.id, username: u.username, email: u.email, role: u.role, status: u.status });

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ message: '请填写完整信息' });
  const hash = await bcrypt.hash(password, 10);
  await db.query('INSERT INTO users (username,email,password_hash,role,status) VALUES (?,?,?,?,?)', [username, email, hash, 'user', 'active']);
  res.json({ message: '注册成功' });
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.query('SELECT * FROM users WHERE email=? LIMIT 1', [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ message: '账号或密码错误' });
  if (user.status === 'disabled') return res.status(403).json({ message: '账号已禁用' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: '账号或密码错误' });
  const token = jwt.sign(safeUser(user), process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: safeUser(user) });
});
router.get('/me', authRequired, async (req, res) => {
  const [rows] = await db.query('SELECT id,username,email,role,status FROM users WHERE id=?', [req.user.id]);
  res.json(rows[0] || null);
});
module.exports = router;
