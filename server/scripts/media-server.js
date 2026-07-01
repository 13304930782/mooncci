require('dotenv').config();

const crypto = require('crypto');
const { spawn } = require('child_process');
const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const app = express();
const port = Number(process.env.MEDIA_PORT || 8081);
const secret = String(process.env.MEDIA_UPLOAD_SECRET || '').trim();
const publicBaseUrl = String(process.env.MEDIA_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
const corsOrigins = String(process.env.MEDIA_CORS_ORIGINS || 'https://mooncci.site,https://www.mooncci.site')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const mediaRoot = process.env.MEDIA_ROOT || '/www/media';
const rawDir = path.join(mediaRoot, 'raw');
const videoDir = path.join(mediaRoot, 'videos');
fs.mkdirSync(rawDir, { recursive: true });
fs.mkdirSync(videoDir, { recursive: true });

if (!secret || !publicBaseUrl) {
  console.error('MEDIA_UPLOAD_SECRET and MEDIA_PUBLIC_BASE_URL are required.');
  process.exit(1);
}

function cors(req, res, next) {
  const origin = req.get('origin');
  if (origin && corsOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
}

function sign(videoId, expiresAt) {
  return crypto.createHmac('sha256', secret).update(`${videoId}:${expiresAt}`).digest('hex');
}

function verifyToken(token) {
  const [videoId, expiresAt, signature] = String(token || '').split(':');
  if (!secret || !videoId || !expiresAt || !signature) return null;
  if (Date.now() > Number(expiresAt)) return null;

  const expected = sign(videoId, expiresAt);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return videoId.replace(/[^0-9a-zA-Z_-]/g, '').slice(0, 80);
}

const upload = multer({
  dest: rawDir,
  limits: { fileSize: Number(process.env.MEDIA_UPLOAD_LIMIT_MB || 2048) * 1024 * 1024 },
});

function runFfmpeg(input, output) {
  const args = [
    '-y',
    '-i', input,
    '-c:v', 'libx264',
    '-preset', process.env.MEDIA_FFMPEG_PRESET || 'veryfast',
    '-crf', process.env.MEDIA_FFMPEG_CRF || '25',
    '-vf', "scale='min(1280,iw)':-2",
    '-r', '30',
    '-c:a', 'aac',
    '-b:a', process.env.MEDIA_AUDIO_BITRATE || '96k',
    '-movflags', '+faststart',
    output,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(process.env.FFMPEG_PATH || 'ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg exited with ${code}`));
    });
  });
}

app.use(cors);
app.options('/api/upload', (_req, res) => res.sendStatus(204));
app.use('/videos', express.static(videoDir, {
  acceptRanges: true,
  maxAge: '7d',
  setHeaders(res) {
    res.setHeader('Cache-Control', 'public, max-age=604800');
  },
}));

app.post('/api/upload', upload.single('video'), async (req, res) => {
  const videoId = verifyToken(req.body.token);
  if (!videoId) {
    if (req.file) fs.rmSync(req.file.path, { force: true });
    return res.status(403).json({ message: 'Invalid upload token.' });
  }
  if (!req.file) return res.status(400).json({ message: 'No video file received.' });

  const stem = `${videoId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const outputName = `${stem}-web.mp4`;
  const outputPath = path.join(videoDir, outputName);

  try {
    await runFfmpeg(req.file.path, outputPath);
    const stat = fs.statSync(outputPath);
    fs.rmSync(req.file.path, { force: true });
    res.json({
      url: `${publicBaseUrl}/videos/${outputName}`,
      filename: outputName,
      size: stat.size,
    });
  } catch (err) {
    fs.rmSync(req.file.path, { force: true });
    fs.rmSync(outputPath, { force: true });
    console.error('[media-upload]', err);
    res.status(500).json({ message: 'Video compression failed.' });
  }
});

app.listen(port, () => {
  console.log(`media server listening on ${port}`);
});
