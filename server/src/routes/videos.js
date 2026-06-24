const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FileType = require('file-type');
const db = require('../db');
const { authRequired, adminOnly, editorOrAdmin, videoReviewerOnly, isAdminLike } = require('../middleware/auth');

const router = express.Router();
const videoDir = path.join(__dirname, '../../uploads/videos');

if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

const allowedVideoExts = ['.mp4', '.webm', '.mov'];
const allowedVideoMimes = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/octet-stream',
];

const detectedVideoTypes = {
  mp4: { ext: '.mp4', mime: 'video/mp4' },
  webm: { ext: '.webm', mime: 'video/webm' },
  mov: { ext: '.mov', mime: 'video/quicktime' },
};

const sourceTypes = new Set(['local', 'direct', 'embed']);
const classOptions = [
  { code: 'software-24-7', label: '软件24-7' },
  { code: 'software-24-8', label: '软件24-8' },
  { code: 'software-24-9', label: '软件24-9' },
  { code: 'software-24-10', label: '软件24-10' },
];
const classCodes = new Set(classOptions.map((item) => item.code));

const detailedScoreFields = [
  { key: 'presentation_appearance_score', label: '仪表大方，衣着端庄，严肃认真（1分）', max: 1 },
  { key: 'presentation_language_score', label: '语言简洁、条理清晰，抓住报告项目主要工作（2分）', max: 2 },
  { key: 'presentation_timing_score', label: '精准掌握自述时间（限制3分钟）（2分）', max: 2 },
  { key: 'principle_analysis_score', label: '能够清晰说明本和分析涉及到的基本原理（5分）', max: 5 },
  { key: 'code_analysis_score', label: '能够准确完成内核代码分析（5分）', max: 5 },
  { key: 'algorithm_design_score', label: '完成模拟算法设计（6分）', max: 6 },
  { key: 'implementation_score', label: '程序运行流畅，功能实现完整（5分）', max: 5 },
  { key: 'logic_quality_score', label: '算法逻辑清晰、合理、严谨（5分）', max: 5 },
  { key: 'ui_design_score', label: '人机交互界面及菜单设计精美（5分）', max: 5 },
  { key: 'extra_feature_score', label: '在完成任务功能的基础上，实现其他功能（4分）', max: 4 },
  { key: 'answer_clarity_score', label: '语言简练，思路清晰，反映敏捷（4分）', max: 4 },
  { key: 'knowledge_score', label: '专业知识熟练掌握，回答流畅正确（6分）', max: 6 },
];

const detailedScoreKeys = detailedScoreFields.map((item) => item.key);

function cleanString(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function cleanStatus(value, fallback = 'draft') {
  return ['draft', 'published'].includes(value) ? value : fallback;
}

function cleanBoolean(value) {
  return value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0;
}

function cleanScorerName(value) {
  return cleanString(value, 100).replace(/\s+/g, ' ');
}

function cleanClassCode(value) {
  const code = cleanString(value, 40).toLowerCase();
  return classCodes.has(code) ? code : '';
}

function classLabel(code) {
  return classOptions.find((item) => item.code === code)?.label || '';
}

function cleanAllowedClasses(value) {
  const input = Array.isArray(value)
    ? value
    : String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  return [...new Set(input.map(cleanClassCode).filter(Boolean))];
}

function cleanGroupName(value) {
  return cleanString(value, 100).replace(/\s+/g, ' ');
}

function normalizeGroupName(value) {
  return cleanGroupName(value)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()（）【】\[\]{}]/g, '');
}

function cleanSourceType(value, fallback = 'local') {
  const next = cleanString(value, 20).toLowerCase();
  return sourceTypes.has(next) ? next : fallback;
}

function clampScore(value) {
  const score = Number(value);
  if (!Number.isInteger(score) || score < 1 || score > 10) return null;
  return score;
}

function clampScoreRange(value, max) {
  const score = Number(value);
  if (!Number.isInteger(score) || score < 0 || score > max) return null;
  return score;
}

function parseDetailedScores(body) {
  const scores = {};

  for (const field of detailedScoreFields) {
    const score = clampScoreRange(body[field.key], field.max);
    if (score == null) return null;
    scores[field.key] = score;
  }

  return scores;
}

function hasDetailedScore(row) {
  return row && row.presentation_appearance_score != null;
}

function sumDetailedScores(row, keys) {
  return keys.reduce((sum, key) => sum + Number(row[key] || 0), 0);
}

function scoreParts(row) {
  if (hasDetailedScore(row)) {
    return {
      self: sumDetailedScores(row, ['presentation_appearance_score', 'presentation_language_score', 'presentation_timing_score']),
      project: sumDetailedScores(row, ['principle_analysis_score', 'code_analysis_score', 'algorithm_design_score', 'implementation_score', 'logic_quality_score', 'ui_design_score', 'extra_feature_score']),
      answer: sumDetailedScores(row, ['answer_clarity_score', 'knowledge_score']),
      total: sumDetailedScores(row, detailedScoreKeys),
      max: 50,
    };
  }

  return {
    self: Number(row.content_score || 0),
    project: Number(row.technical_score || 0) + Number(row.delivery_score || 0),
    answer: Number(row.defense_score || 0),
    total: Number(row.content_score || 0) + Number(row.delivery_score || 0) + Number(row.technical_score || 0) + Number(row.defense_score || 0),
    max: 40,
  };
}

function scoreTotal(row) {
  return scoreParts(row).total;
}

function normalizedScore(row) {
  const parts = scoreParts(row);
  return parts.max > 0 ? (parts.total / parts.max) * 100 : 0;
}

function requestIp(req) {
  return cleanString(String(req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip || req.socket?.remoteAddress || '', 64);
}

function mapScoreRow(row) {
  const parts = scoreParts(row);
  return {
    ...row,
    total_score: parts.total,
    max_score: parts.max,
    self_score: parts.self,
    project_score: parts.project,
    answer_score: parts.answer,
  };
}

function safeBasename(filename) {
  return path.basename(String(filename || '')).trim();
}

function toPublicVideoUrl(filename) {
  return `/api/videos/files/${safeBasename(filename)}`;
}

function videoPathFor(filename) {
  return path.join(videoDir, safeBasename(filename));
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function removeFile(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('[videos] remove file failed:', err.message);
    }
  }
}

let publicScoringSchemaPromise = null;

async function columnExists(tableName, columnName) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?
    `,
    [tableName, columnName]
  );

  return Number(rows[0]?.count || 0) > 0;
}

async function indexExists(tableName, indexName) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME=? AND INDEX_NAME=?
    `,
    [tableName, indexName]
  );

  return Number(rows[0]?.count || 0) > 0;
}

async function ensurePublicScoringSchemaOnce() {
  if (!(await columnExists('videos', 'public_scoring_enabled'))) {
    await db.query('ALTER TABLE videos ADD COLUMN public_scoring_enabled TINYINT NOT NULL DEFAULT 0 AFTER cover_image');
  }

  if (!(await columnExists('videos', 'class_code'))) {
    await db.query('ALTER TABLE videos ADD COLUMN class_code VARCHAR(40) NOT NULL DEFAULT "" AFTER team_name');
  }

  if (!(await columnExists('video_scores', 'scorer_name'))) {
    await db.query('ALTER TABLE video_scores ADD COLUMN scorer_name VARCHAR(100) NULL AFTER user_id');
  }

  if (!(await columnExists('video_scores', 'scorer_class_code'))) {
    await db.query('ALTER TABLE video_scores ADD COLUMN scorer_class_code VARCHAR(40) NULL AFTER scorer_name');
  }

  if (!(await columnExists('video_scores', 'scorer_group_name'))) {
    await db.query('ALTER TABLE video_scores ADD COLUMN scorer_group_name VARCHAR(100) NULL AFTER scorer_class_code');
  }

  if (!(await columnExists('video_scores', 'scorer_ip'))) {
    await db.query('ALTER TABLE video_scores ADD COLUMN scorer_ip VARCHAR(64) NULL AFTER scorer_group_name');
  }

  if (!(await columnExists('video_scores', 'scorer_user_agent'))) {
    await db.query('ALTER TABLE video_scores ADD COLUMN scorer_user_agent VARCHAR(255) NULL AFTER scorer_ip');
  }

  const previousColumn = {
    presentation_appearance_score: 'comment',
    presentation_language_score: 'presentation_appearance_score',
    presentation_timing_score: 'presentation_language_score',
    principle_analysis_score: 'presentation_timing_score',
    code_analysis_score: 'principle_analysis_score',
    algorithm_design_score: 'code_analysis_score',
    implementation_score: 'algorithm_design_score',
    logic_quality_score: 'implementation_score',
    ui_design_score: 'logic_quality_score',
    extra_feature_score: 'ui_design_score',
    answer_clarity_score: 'extra_feature_score',
    knowledge_score: 'answer_clarity_score',
  };

  for (const field of detailedScoreFields) {
    if (!(await columnExists('video_scores', field.key))) {
      await db.query(`ALTER TABLE video_scores ADD COLUMN ${field.key} TINYINT NULL AFTER ${previousColumn[field.key]}`);
    }
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS video_allowed_classes (
      id INT NOT NULL AUTO_INCREMENT,
      video_id INT NOT NULL,
      class_code VARCHAR(40) NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_video_allowed_class (video_id, class_code),
      KEY idx_video_allowed_class (class_code),
      CONSTRAINT fk_video_allowed_classes_video
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [userIdColumns] = await db.query(
    `
    SELECT IS_NULLABLE AS nullable
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='video_scores' AND COLUMN_NAME='user_id'
    LIMIT 1
    `
  );

  if (userIdColumns[0]?.nullable === 'NO') {
    await db.query('ALTER TABLE video_scores MODIFY COLUMN user_id INT(11) DEFAULT NULL');
  }

  if (await indexExists('video_scores', 'uniq_video_scorer_name')) {
    await db.query('DROP INDEX uniq_video_scorer_name ON video_scores');
  }

  if (!(await indexExists('video_scores', 'uniq_video_scorer_class_name'))) {
    try {
      await db.query('CREATE UNIQUE INDEX uniq_video_scorer_class_name ON video_scores (video_id, scorer_class_code, scorer_name)');
    } catch (err) {
      if (err?.code === 'ER_DUP_ENTRY') {
        console.warn('[videos/schema] skip uniq_video_scorer_class_name because duplicate scorer names already exist');
      } else {
        throw err;
      }
    }
  }
}

async function ensurePublicScoringSchema() {
  if (!publicScoringSchemaPromise) {
    publicScoringSchemaPromise = ensurePublicScoringSchemaOnce().catch((err) => {
      publicScoringSchemaPromise = null;
      throw err;
    });
  }

  return publicScoringSchemaPromise;
}

function isAllowedVideo(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  return allowedVideoExts.includes(ext) && allowedVideoMimes.includes(file.mimetype);
}

async function validateVideoFile(filePath, originalName) {
  const originalExt = path.extname(originalName || '').toLowerCase();
  const detected = await FileType.fromFile(filePath);

  if (!detected) {
    return { ok: originalExt === '.mp4', ext: originalExt, mime: 'video/mp4' };
  }

  const mapped = detectedVideoTypes[detected.ext];
  if (!mapped || !allowedVideoExts.includes(mapped.ext)) {
    return { ok: false, detected };
  }

  return { ok: true, ext: mapped.ext, mime: mapped.mime };
}

function extractIframeSrc(value) {
  const text = cleanString(value, 4000).replace(/&amp;/g, '&');
  const match = text.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : text;
}

function parseHttpUrl(value) {
  const raw = extractIframeSrc(value);
  if (!raw) return null;

  try {
    const url = new URL(raw.startsWith('//') ? `https:${raw}` : raw);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url;
  } catch {
    return null;
  }
}

function normalizeYouTube(url) {
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  const parts = url.pathname.split('/').filter(Boolean);
  let id = '';

  if (host === 'youtu.be') {
    id = parts[0] || '';
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host.endsWith('.youtube.com')) {
    if (parts[0] === 'embed') id = parts[1] || '';
    if (parts[0] === 'shorts') id = parts[1] || '';
    if (parts[0] === 'live') id = parts[1] || '';
    if (!id) id = url.searchParams.get('v') || '';
  }

  id = id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  if (!id) return null;

  return {
    embed_url: `https://www.youtube-nocookie.com/embed/${id}`,
    provider: 'youtube',
  };
}

function normalizeBilibili(url) {
  const host = url.hostname.toLowerCase();

  if (host === 'player.bilibili.com') {
    url.protocol = 'https:';
    url.searchParams.set('autoplay', url.searchParams.get('autoplay') || '0');
    return { embed_url: url.toString(), provider: 'bilibili' };
  }

  if (!host.endsWith('bilibili.com')) return null;

  const match = url.pathname.match(/\/video\/(BV[a-zA-Z0-9]+|av\d+)/i);
  if (!match) return null;

  const videoId = match[1];
  const player = new URL('https://player.bilibili.com/player.html');
  if (videoId.toLowerCase().startsWith('bv')) {
    player.searchParams.set('bvid', videoId);
  } else {
    player.searchParams.set('aid', videoId.replace(/^av/i, ''));
  }
  const page = url.searchParams.get('p');
  if (page) player.searchParams.set('page', page);
  player.searchParams.set('autoplay', '0');

  return { embed_url: player.toString(), provider: 'bilibili' };
}

function normalizeEmbedUrl(value) {
  const url = parseHttpUrl(value);
  if (!url) return null;

  const youtube = normalizeYouTube(url);
  if (youtube) return youtube;

  const bilibili = normalizeBilibili(url);
  if (bilibili) return bilibili;

  return {
    embed_url: url.toString(),
    provider: cleanString(url.hostname.replace(/^www\./, ''), 40) || 'embed',
  };
}

function normalizeDirectUrl(value) {
  const url = parseHttpUrl(value);
  if (!url) return '';
  return url.toString().slice(0, 800);
}

function sourceLabel(row) {
  const type = cleanSourceType(row.source_type);
  if (type === 'embed') {
    if (row.provider === 'youtube') return 'YouTube 嵌入';
    if (row.provider === 'bilibili') return 'B站嵌入';
    return '第三方嵌入';
  }
  if (type === 'direct') return '外部直链';
  return '本地上传';
}

function getFirstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
}

function normalizeSourcePayload(body, current = null) {
  const rawSourceType = getFirstValue(
    body.source_type,
    body.sourceType,
    body.video_source,
    body.videoSource,
    body.source
  );
  const directInput = getFirstValue(
    body.video_url,
    body.videoUrl,
    body.external_url,
    body.externalUrl,
    body.externalVideoUrl,
    body.direct_url,
    body.directUrl,
    body.url
  );
  const embedInput = getFirstValue(
    body.embed_url,
    body.embedUrl,
    body.iframe_url,
    body.iframeUrl,
    body.embed,
    body.iframe
  );

  let source_type = cleanSourceType(rawSourceType, current?.source_type || 'local');

  if (!rawSourceType) {
    if (embedInput) {
      source_type = 'embed';
    } else if (directInput) {
      source_type = 'direct';
    }
  }

  if (source_type === 'embed') {
    const normalized = normalizeEmbedUrl(embedInput || directInput);
    if (!normalized) {
      const error = new Error('请填写有效的第三方嵌入链接，支持 B站、YouTube iframe/分享链接，也支持其他 https iframe 地址');
      error.statusCode = 400;
      throw error;
    }

    return {
      source_type,
      video_url: null,
      video_filename: null,
      video_mime: null,
      video_size: null,
      embed_url: normalized.embed_url,
      provider: cleanString(body.provider || body.providerName || normalized.provider, 40),
    };
  }

  if (source_type === 'direct') {
    const video_url = normalizeDirectUrl(directInput);
    if (!video_url) {
      const error = new Error('请填写有效的外部 MP4/WebM/MOV 直链，必须是 http 或 https 地址');
      error.statusCode = 400;
      throw error;
    }

    return {
      source_type,
      video_url,
      video_filename: null,
      video_mime: null,
      video_size: null,
      embed_url: null,
      provider: cleanString(body.provider || body.providerName || 'direct', 40),
    };
  }

  return {
    source_type: 'local',
    video_url: current?.source_type === 'local' ? current.video_url || null : null,
    video_filename: current?.source_type === 'local' ? current.video_filename || null : null,
    video_mime: current?.source_type === 'local' ? current.video_mime || null : null,
    video_size: current?.source_type === 'local' ? current.video_size || null : null,
    embed_url: null,
    provider: null,
  };
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, videoDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = allowedVideoExts.includes(ext) ? ext : '.mp4';
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.VIDEO_UPLOAD_LIMIT_MB || 512) * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedVideo(file)) {
      return cb(new Error('只允许上传 mp4、webm、mov 视频文件'));
    }
    cb(null, true);
  },
});

const detailedTotalSql = detailedScoreKeys.map((key) => `COALESCE(${key}, 0)`).join(' + ');
const selfScoreSql = ['presentation_appearance_score', 'presentation_language_score', 'presentation_timing_score'].map((key) => `COALESCE(${key}, 0)`).join(' + ');
const projectScoreSql = ['principle_analysis_score', 'code_analysis_score', 'algorithm_design_score', 'implementation_score', 'logic_quality_score', 'ui_design_score', 'extra_feature_score'].map((key) => `COALESCE(${key}, 0)`).join(' + ');
const answerScoreSql = ['answer_clarity_score', 'knowledge_score'].map((key) => `COALESCE(${key}, 0)`).join(' + ');

function scoreSqlExpression() {
  return `CASE
    WHEN presentation_appearance_score IS NOT NULL THEN ${detailedTotalSql}
    ELSE content_score + delivery_score + technical_score + defense_score
  END`;
}

function categorySqlExpression(category) {
  if (category === 'self') {
    return `CASE WHEN presentation_appearance_score IS NOT NULL THEN ${selfScoreSql} ELSE content_score END`;
  }
  if (category === 'project') {
    return `CASE WHEN presentation_appearance_score IS NOT NULL THEN ${projectScoreSql} ELSE technical_score + delivery_score END`;
  }
  if (category === 'answer') {
    return `CASE WHEN presentation_appearance_score IS NOT NULL THEN ${answerScoreSql} ELSE defense_score END`;
  }
  return scoreSqlExpression();
}

function mapVideoRow(row) {
  const allowedClassCodes = String(row.allowed_class_codes || '')
    .split(',')
    .map((item) => cleanClassCode(item))
    .filter(Boolean);

  return {
    ...row,
    source_type: cleanSourceType(row.source_type),
    source_label: sourceLabel(row),
    class_code: cleanClassCode(row.class_code),
    class_label: classLabel(cleanClassCode(row.class_code)),
    allowed_class_codes: [...new Set(allowedClassCodes)],
    allowed_class_labels: [...new Set(allowedClassCodes)].map(classLabel).filter(Boolean),
    score_count: Number(row.score_count || 0),
    avg_total_score: row.avg_total_score == null ? null : Number(row.avg_total_score),
    avg_content_score: row.avg_content_score == null ? null : Number(row.avg_content_score),
    avg_delivery_score: row.avg_delivery_score == null ? null : Number(row.avg_delivery_score),
    avg_technical_score: row.avg_technical_score == null ? null : Number(row.avg_technical_score),
    avg_defense_score: row.avg_defense_score == null ? null : Number(row.avg_defense_score),
    video_size_text: formatFileSize(row.video_size),
    public_scoring_enabled: Number(row.public_scoring_enabled || 0),
  };
}

function buildVideoSummarySql(whereSql = '') {
  return `
    SELECT
      v.*,
      u.username AS creator_name,
      COALESCE(sc.score_count, 0) AS score_count,
      sc.avg_total_score,
      sc.avg_content_score,
      sc.avg_delivery_score,
      sc.avg_technical_score,
      sc.avg_defense_score,
      ac.allowed_class_codes
    FROM videos v
    LEFT JOIN users u ON u.id = v.created_by
    LEFT JOIN (
      SELECT
        video_id,
        GROUP_CONCAT(class_code ORDER BY class_code SEPARATOR ',') AS allowed_class_codes
      FROM video_allowed_classes
      GROUP BY video_id
    ) ac ON ac.video_id = v.id
    LEFT JOIN (
      SELECT
        video_id,
        COUNT(id) AS score_count,
        ROUND(AVG(${scoreSqlExpression()}), 2) AS avg_total_score,
        ROUND(AVG(${categorySqlExpression('self')}), 2) AS avg_content_score,
        NULL AS avg_delivery_score,
        ROUND(AVG(${categorySqlExpression('project')}), 2) AS avg_technical_score,
        ROUND(AVG(${categorySqlExpression('answer')}), 2) AS avg_defense_score
      FROM video_scores
      GROUP BY video_id
    ) sc ON sc.video_id = v.id
    ${whereSql}
  `;
}

async function fetchVideo(id, includeDraft = false) {
  const where = includeDraft ? 'WHERE v.id=?' : 'WHERE v.id=? AND v.status="published"';
  const [rows] = await db.query(
    `${buildVideoSummarySql(where)} LIMIT 1`,
    [id]
  );
  return rows[0] ? mapVideoRow(rows[0]) : null;
}

async function saveAllowedClasses(videoId, allowedClasses) {
  await db.query('DELETE FROM video_allowed_classes WHERE video_id=?', [videoId]);

  if (!allowedClasses.length) return;

  await db.query(
    'INSERT INTO video_allowed_classes (video_id, class_code) VALUES ?',
    [allowedClasses.map((classCode) => [videoId, classCode])]
  );
}

async function classCanScoreVideo(videoId, classCode) {
  const [countRows] = await db.query(
    'SELECT COUNT(*) AS count FROM video_allowed_classes WHERE video_id=?',
    [videoId]
  );

  if (Number(countRows[0]?.count || 0) === 0) {
    return true;
  }

  const [rows] = await db.query(
    'SELECT id FROM video_allowed_classes WHERE video_id=? AND class_code=? LIMIT 1',
    [videoId, classCode]
  );

  return Boolean(rows[0]);
}


const scoreWeights = {
  content: 0.30,
  technical: 0.30,
  delivery: 0.20,
  defense: 0.20,
};

function roundNumber(value, digits = 2) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function weightedScore(row) {
  return normalizedScore(row);
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stddev(values, avg) {
  if (!values.length || avg == null) return null;
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function buildRankingRows(videos, scoreRows) {
  const grouped = new Map();

  scoreRows.forEach((row) => {
    const key = Number(row.video_id);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  });

  const maxScoreCount = Math.max(...videos.map((video) => Number(video.score_count || 0)), 0);

  const rows = videos.map((video) => {
    const scores = grouped.get(Number(video.id)) || [];
    const weightedScores = scores.map(weightedScore).filter((value) => Number.isFinite(value));
    const scoreCount = weightedScores.length;

    const weightedAvg = average(weightedScores);
    const scoreStddev = stddev(weightedScores, weightedAvg);

    const scorePartRows = scores.map(scoreParts);
    const avgContent = average(scorePartRows.map((row) => Number(row.self || 0)));
    const avgDelivery = null;
    const avgTechnical = average(scorePartRows.map((row) => Number(row.project || 0)));
    const avgDefense = average(scorePartRows.map((row) => Number(row.answer || 0)));

    // 最终排名分：主体是全班均分；人数和稳定度只做小幅校正；最后用维度小权重拆平分。
    // 这样不会因为同分而全挤在一起，也不会让随机 id 影响排名。
    const baseScore100 = weightedAvg == null ? null : weightedAvg;
    const participationBonus = maxScoreCount > 0 ? Math.min(scoreCount / maxScoreCount, 1) * 0.30 : 0;
    const consistencyBonus = scoreStddev == null ? 0 : Math.max(0, 1 - Math.min(scoreStddev / 2.5, 1)) * 0.20;
    const tieBreaker = scoreCount > 0
      ? Number(avgTechnical || 0) * 0.003 + Number(avgContent || 0) * 0.002 + Number(avgDelivery || 0) * 0.001 + Number(avgDefense || 0) * 0.0005 + scoreCount * 0.0001
      : 0;
    const finalScore = baseScore100 == null ? null : baseScore100 + participationBonus + consistencyBonus + tieBreaker;

    return {
      id: video.id,
      title: video.title,
      class_code: video.class_code || '',
      class_label: video.class_label || '',
      team_name: video.team_name || '',
      speaker_names: video.speaker_names || '',
      status: video.status,
      source_label: video.source_label,
      score_count: scoreCount,
      avg_content_score: roundNumber(avgContent, 2),
      avg_delivery_score: roundNumber(avgDelivery, 2),
      avg_technical_score: roundNumber(avgTechnical, 2),
      avg_defense_score: roundNumber(avgDefense, 2),
      weighted_score: roundNumber(weightedAvg, 3),
      score_stddev: roundNumber(scoreStddev, 3),
      participation_bonus: roundNumber(participationBonus, 3),
      consistency_bonus: roundNumber(consistencyBonus, 3),
      tie_breaker: roundNumber(tieBreaker, 4),
      final_score: roundNumber(finalScore, 3),
    };
  });

  rows.sort((a, b) => {
    if (a.final_score == null && b.final_score == null) return Number(a.id) - Number(b.id);
    if (a.final_score == null) return 1;
    if (b.final_score == null) return -1;
    return b.final_score - a.final_score;
  });

  let rank = 0;
  return rows.map((row) => {
    if (row.final_score != null) rank += 1;
    return { ...row, rank: row.final_score == null ? null : rank };
  });
}

async function fetchAdminVideos(user, filters = {}) {
  const where = [];
  const params = [];

  if (!isAdminLike(user)) {
    where.push('v.created_by=?');
    params.push(user.id);
  }

  const videoClassCode = cleanClassCode(filters.video_class_code || filters.class_code);
  if (videoClassCode) {
    where.push('v.class_code=?');
    params.push(videoClassCode);
  }

  const [rows] = await db.query(
    `
    ${buildVideoSummarySql(where.length ? `WHERE ${where.join(' AND ')}` : '')}
    ORDER BY v.updated_at DESC, v.id DESC
    LIMIT 300
    `,
    params
  );
  return rows.map(mapVideoRow);
}

async function fetchRankingRows(user, filters = {}) {
  const videos = await fetchAdminVideos(user, filters);
  const videoIds = videos.map((video) => Number(video.id));
  if (!videoIds.length) return [];

  const videoClassCode = cleanClassCode(filters.video_class_code || filters.class_code);
  const scorerClassCode = cleanClassCode(filters.scorer_class_code) || videoClassCode;
  const where = ['s.video_id IN (?)'];
  const params = [videoIds];

  if (scorerClassCode) {
    where.push('s.scorer_class_code=?');
    params.push(scorerClassCode);
  }

  const [scoreRows] = await db.query(
    `
    SELECT
      s.*,
      COALESCE(u.username, s.scorer_name) AS username
    FROM video_scores s
    LEFT JOIN users u ON u.id = s.user_id
    WHERE ${where.join(' AND ')}
    ORDER BY s.video_id ASC, s.updated_at ASC
    `,
    params
  );

  return buildRankingRows(videos, scoreRows);
}

async function fetchScoreRecordRows(user, filters = {}) {
  const videos = await fetchAdminVideos(user, filters);
  const videoIds = videos.map((video) => Number(video.id));
  if (!videoIds.length) return [];

  const videoById = new Map(videos.map((video) => [Number(video.id), video]));
  const videoClassCode = cleanClassCode(filters.video_class_code || filters.class_code);
  const scorerClassCode = cleanClassCode(filters.scorer_class_code) || videoClassCode;
  const where = ['s.video_id IN (?)'];
  const params = [videoIds];

  if (scorerClassCode) {
    where.push('s.scorer_class_code=?');
    params.push(scorerClassCode);
  }

  const [scoreRows] = await db.query(
    `
    SELECT
      s.*,
      COALESCE(u.username, s.scorer_name) AS username
    FROM video_scores s
    LEFT JOIN users u ON u.id = s.user_id
    WHERE ${where.join(' AND ')}
    ORDER BY s.video_id ASC, s.scorer_class_code ASC, s.scorer_group_name ASC, s.updated_at ASC
    `,
    params
  );

  return scoreRows.map((score) => ({
    video: videoById.get(Number(score.video_id)),
    score: mapScoreRow(score),
  })).filter((row) => row.video);
}

function csvCell(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function buildRankingCsv(rows) {
  const headers = [
    '排名',
    '视频标题',
    '所属班级',
    '分组',
    '主讲人',
    '评分人数',
    '最终排名分',
    '归一化均分',
    '自述均分',
    '项目均分',
    '回答均分',
    '标准差',
    '人数加成',
    '稳定度加成',
    '拆分同分小权重',
    '状态',
  ];

  const lines = [headers.map(csvCell).join(',')];

  rows.forEach((row) => {
    lines.push([
      row.rank || '',
      row.title,
      row.class_label || classLabel(row.class_code) || '',
      row.team_name,
      row.speaker_names,
      row.score_count,
      row.final_score,
      row.weighted_score,
      row.avg_content_score,
      row.avg_technical_score,
      row.avg_defense_score,
      row.score_stddev,
      row.participation_bonus,
      row.consistency_bonus,
      row.tie_breaker,
      row.status === 'published' ? '已发布' : '草稿',
    ].map(csvCell).join(','));
  });

  lines.push('');
  lines.push(['评分说明', '新评分表满分50分，按自述5分、项目35分、回答问题10分统计；旧40分评分会自动归一化参与排名。'].map(csvCell).join(','));

  return `\ufeff${lines.join('\n')}`;
}

function buildScoreRecordCsv(rows) {
  const now = new Date();
  const headers = [
    '班级',
    '组别',
    '评审班级',
    '评审小组组别',
    '评审人',
    ...detailedScoreFields.map((field) => field.label),
    '总分（50分）',
    '评分日期',
    'IP',
    '点评',
  ];

  const lines = [
    ['《操作系统》综合训练项目答辩——评审小组评分记录表'].map(csvCell).join(','),
    ['训练项目名称', '操作系统综合训练项目答辩', '', '', '', '评审小组组别', '见评分明细'].map(csvCell).join(','),
    ['答辩时间', `${now.getFullYear()}年`, `${now.getMonth() + 1}月`, `${now.getDate()}日`, '', '答辩地点', '', '答辩教师', ''].map(csvCell).join(','),
    '',
    headers.map(csvCell).join(','),
  ];

  rows.forEach(({ video, score }) => {
    lines.push([
      video.class_label || classLabel(video.class_code) || '',
      video.team_name || '',
      classLabel(score.scorer_class_code) || '',
      score.scorer_group_name || '',
      score.username || score.scorer_name || '',
      ...detailedScoreFields.map((field) => score[field.key] ?? ''),
      score.total_score,
      score.updated_at || '',
      score.scorer_ip || '',
      score.comment || '',
    ].map(csvCell).join(','));
  });

  return `\ufeff${lines.join('\n')}`;
}

router.use('/files', express.static(videoDir, {
  acceptRanges: true,
  maxAge: '7d',
  immutable: false,
  setHeaders(res) {
    res.setHeader('Cache-Control', 'public, max-age=604800');
  },
}));

router.use(async (_req, res, next) => {
  try {
    await ensurePublicScoringSchema();
    next();
  } catch (err) {
    console.error('[videos/schema]', err);
    res.status(500).json({ message: '视频评分表结构检查失败' });
  }
});

router.get('/', async (req, res) => {
  try {
    const classCode = cleanClassCode(req.query.class_code || req.query.class);
    const where = classCode
      ? `WHERE v.status="published" AND (
          v.class_code=?
          OR EXISTS (
            SELECT 1 FROM video_allowed_classes vac
            WHERE vac.video_id=v.id AND vac.class_code=?
          )
        )`
      : 'WHERE v.status="published"';
    const params = classCode ? [classCode, classCode] : [];

    const [rows] = await db.query(
      `
      ${buildVideoSummarySql(where)}
      ORDER BY v.sort_order ASC, v.published_at DESC, v.created_at DESC
      LIMIT 200
      `,
      params
    );
    res.json(rows.map(mapVideoRow));
  } catch (err) {
    console.error('[videos/list]', err);
    res.status(500).json({ message: '视频列表加载失败' });
  }
});

router.get('/admin/rankings', authRequired, videoReviewerOnly, async (req, res) => {
  try {
    if (!cleanClassCode(req.query.video_class_code || req.query.class_code)) {
      res.json([]);
      return;
    }

    res.json(await fetchRankingRows(req.user, req.query));
  } catch (err) {
    console.error('[videos/admin/rankings]', err);
    res.status(500).json({ message: '评分排名加载失败' });
  }
});

router.get('/admin/rankings/export', authRequired, videoReviewerOnly, async (req, res) => {
  try {
    const rows = cleanClassCode(req.query.video_class_code || req.query.class_code)
      ? await fetchScoreRecordRows(req.user, req.query)
      : [];
    const csv = buildScoreRecordCsv(rows);
    const filename = `video-score-records-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error('[videos/admin/rankings/export]', err);
    res.status(500).json({ message: '评分导出失败' });
  }
});

router.get('/admin', authRequired, videoReviewerOnly, async (req, res) => {
  try {
    res.json(await fetchAdminVideos(req.user));
  } catch (err) {
    console.error('[videos/admin/list]', err);
    res.status(500).json({ message: '后台视频列表加载失败' });
  }
});

router.get('/admin/:id/scores', authRequired, videoReviewerOnly, async (req, res) => {
  try {
    const video = await fetchVideo(req.params.id, true);
    if (!video) return res.status(404).json({ message: '视频不存在' });

    const [rows] = await db.query(
      `
      SELECT
        s.*,
        COALESCE(u.username, s.scorer_name) AS username
      FROM video_scores s
      LEFT JOIN users u ON u.id = s.user_id
      WHERE s.video_id=?
      ORDER BY s.updated_at DESC
      `,
      [req.params.id]
    );

    res.json({ video, scores: rows.map(mapScoreRow) });
  } catch (err) {
    console.error('[videos/admin/scores]', err);
    res.status(500).json({ message: '评分明细加载失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const video = await fetchVideo(req.params.id, false);
    if (!video) return res.status(404).json({ message: '视频不存在或尚未发布' });
    res.json(video);
  } catch (err) {
    console.error('[videos/detail]', err);
    res.status(500).json({ message: '视频详情加载失败' });
  }
});

router.get('/:id/my-score', authRequired, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM video_scores WHERE video_id=? AND user_id=? LIMIT 1', [req.params.id, req.user.id]);
    res.json(rows[0] ? mapScoreRow(rows[0]) : null);
  } catch (err) {
    console.error('[videos/my-score]', err);
    res.status(500).json({ message: '评分加载失败' });
  }
});

router.post('/', authRequired, editorOrAdmin, async (req, res) => {
  try {
    const title = cleanString(req.body.title, 255);
    if (!title) return res.status(400).json({ message: '视频标题不能为空' });

    const status = cleanStatus(req.body.status);
    const publishedAt = status === 'published' ? new Date() : null;
    const source = normalizeSourcePayload(req.body);
    const classCode = cleanClassCode(req.body.class_code || req.body.classCode);
    const allowedClasses = cleanAllowedClasses(req.body.allowed_class_codes ?? req.body.allowedClassCodes);

    const [result] = await db.query(
      `
      INSERT INTO videos
      (title, summary, team_name, class_code, speaker_names, source_type, video_url, video_filename, video_mime, video_size, embed_url, provider, cover_image, public_scoring_enabled, status, sort_order, created_by, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        cleanString(req.body.summary, 2000),
        cleanString(req.body.team_name, 120),
        classCode,
        cleanString(req.body.speaker_names, 255),
        source.source_type,
        source.video_url,
        source.video_filename,
        source.video_mime,
        source.video_size,
        source.embed_url,
        source.provider,
        cleanString(req.body.cover_image, 500),
        cleanBoolean(req.body.public_scoring_enabled ?? req.body.publicScoringEnabled),
        status,
        Number.parseInt(req.body.sort_order, 10) || 0,
        req.user.id,
        publishedAt,
      ]
    );

    await saveAllowedClasses(result.insertId, allowedClasses);
    res.json(await fetchVideo(result.insertId, true));
  } catch (err) {
    console.error('[videos/create]', err);
    res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : '视频创建失败' });
  }
});

router.put('/:id', authRequired, editorOrAdmin, async (req, res) => {
  try {
    const video = await fetchVideo(req.params.id, true);
    if (!video) return res.status(404).json({ message: '视频不存在' });
    if (!isAdminLike(req.user) && Number(video.created_by) !== Number(req.user.id)) {
      return res.status(403).json({ message: '无权限编辑这个视频' });
    }

    const title = cleanString(req.body.title, 255);
    if (!title) return res.status(400).json({ message: '视频标题不能为空' });

    const status = cleanStatus(req.body.status, video.status);
    const publishedAt = status === 'published' ? (video.published_at || new Date()) : null;
    const source = normalizeSourcePayload(req.body, video);
    const classCode = cleanClassCode(req.body.class_code || req.body.classCode);
    const allowedClasses = cleanAllowedClasses(req.body.allowed_class_codes ?? req.body.allowedClassCodes);

    if (source.source_type !== 'local' && video.video_filename) {
      removeFile(videoPathFor(video.video_filename));
    }

    await db.query(
      `
      UPDATE videos
      SET title=?, summary=?, team_name=?, class_code=?, speaker_names=?, source_type=?, video_url=?, video_filename=?, video_mime=?, video_size=?, embed_url=?, provider=?, cover_image=?, public_scoring_enabled=?, status=?, sort_order=?, published_at=?
      WHERE id=?
      `,
      [
        title,
        cleanString(req.body.summary, 2000),
        cleanString(req.body.team_name, 120),
        classCode,
        cleanString(req.body.speaker_names, 255),
        source.source_type,
        source.video_url,
        source.video_filename,
        source.video_mime,
        source.video_size,
        source.embed_url,
        source.provider,
        cleanString(req.body.cover_image, 500),
        cleanBoolean(req.body.public_scoring_enabled ?? req.body.publicScoringEnabled),
        status,
        Number.parseInt(req.body.sort_order, 10) || 0,
        publishedAt,
        req.params.id,
      ]
    );

    await saveAllowedClasses(req.params.id, allowedClasses);
    res.json(await fetchVideo(req.params.id, true));
  } catch (err) {
    console.error('[videos/update]', err);
    res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : '视频保存失败' });
  }
});

router.post('/:id/file', authRequired, editorOrAdmin, (req, res) => {
  upload.single('video')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message || '视频上传失败' });
    if (!req.file) return res.status(400).json({ message: '没有收到视频文件' });

    try {
      const video = await fetchVideo(req.params.id, true);
      if (!video) {
        removeFile(req.file.path);
        return res.status(404).json({ message: '视频不存在' });
      }
      if (!isAdminLike(req.user) && Number(video.created_by) !== Number(req.user.id)) {
        removeFile(req.file.path);
        return res.status(403).json({ message: '无权限上传这个视频' });
      }

      const validation = await validateVideoFile(req.file.path, req.file.originalname);
      if (!validation.ok) {
        removeFile(req.file.path);
        return res.status(400).json({ message: '视频内容校验失败' });
      }

      if (validation.ext && path.extname(req.file.filename).toLowerCase() !== validation.ext) {
        const nextFilename = `${path.basename(req.file.filename, path.extname(req.file.filename))}${validation.ext}`;
        const nextPath = path.join(videoDir, nextFilename);
        fs.renameSync(req.file.path, nextPath);
        req.file.filename = nextFilename;
        req.file.path = nextPath;
      }

      if (video.video_filename) {
        removeFile(videoPathFor(video.video_filename));
      }

      const stat = fs.statSync(req.file.path);
      await db.query(
        'UPDATE videos SET source_type="local", video_url=?, video_filename=?, video_mime=?, video_size=?, embed_url=NULL, provider=NULL, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        [
          toPublicVideoUrl(req.file.filename),
          req.file.filename,
          validation.mime || req.file.mimetype,
          stat.size,
          req.params.id,
        ]
      );

      res.json(await fetchVideo(req.params.id, true));
    } catch (uploadErr) {
      removeFile(req.file.path);
      console.error('[videos/upload]', uploadErr);
      res.status(500).json({ message: '视频上传失败' });
    }
  });
});

router.post('/:id/score', authRequired, async (req, res) => {
  try {
    if (!['owner', 'admin', 'editor'].includes(req.user.role) && Number(req.user.can_comment) !== 1) {
      return res.status(403).json({ message: '当前账号不能评分' });
    }

    const video = await fetchVideo(req.params.id, false);
    if (!video) return res.status(404).json({ message: '视频不存在或尚未发布' });

    const detailedScores = parseDetailedScores(req.body);
    let scores;

    if (detailedScores) {
      const parts = scoreParts(detailedScores);
      scores = {
        content: parts.self,
        delivery: 0,
        technical: parts.project,
        defense: parts.answer,
      };
    } else {
      scores = {
        content: clampScore(req.body.content_score),
        delivery: clampScore(req.body.delivery_score),
        technical: clampScore(req.body.technical_score),
        defense: clampScore(req.body.defense_score),
      };

      if (Object.values(scores).some((score) => score == null)) {
        return res.status(400).json({ message: '请按评分表填写所有细项分数' });
      }
    }

    const detailedColumns = detailedScoreKeys.join(', ');
    const detailedPlaceholders = detailedScoreKeys.map(() => '?').join(', ');
    const detailedUpdates = detailedScoreKeys.map((key) => `${key}=VALUES(${key})`).join(',\n        ');
    const detailedValues = detailedScores ? detailedScoreKeys.map((key) => detailedScores[key]) : detailedScoreKeys.map(() => null);

    await db.query(
      `
      INSERT INTO video_scores
      (video_id, user_id, content_score, delivery_score, technical_score, defense_score, comment, ${detailedColumns})
      VALUES (?, ?, ?, ?, ?, ?, ?, ${detailedPlaceholders})
      ON DUPLICATE KEY UPDATE
        content_score=VALUES(content_score),
        delivery_score=VALUES(delivery_score),
        technical_score=VALUES(technical_score),
        defense_score=VALUES(defense_score),
        comment=VALUES(comment),
        ${detailedUpdates},
        updated_at=CURRENT_TIMESTAMP
      `,
      [
        req.params.id,
        req.user.id,
        scores.content,
        scores.delivery,
        scores.technical,
        scores.defense,
        cleanString(req.body.comment, 2000),
        ...detailedValues,
      ]
    );

    res.json({ message: '评分已保存', video: await fetchVideo(req.params.id, false) });
  } catch (err) {
    console.error('[videos/score]', err);
    res.status(500).json({ message: '评分保存失败' });
  }
});

async function validatePublicScoreRequest(req, video) {
  if (!video) return { error: { status: 404, message: '视频不存在或尚未发布' } };
  if (Number(video.public_scoring_enabled) !== 1) {
    return { error: { status: 403, message: '该视频未开启免登录评分' } };
  }

  const scorerName = cleanScorerName(req.body.scorer_name || req.query.scorer_name);
  if (!scorerName) {
    return { error: { status: 400, message: '姓名不能为空' } };
  }

  const scorerClassCode = cleanClassCode(req.body.scorer_class_code || req.body.scorerClassCode || req.query.scorer_class_code || req.query.scorerClassCode);
  if (!scorerClassCode) {
    return { error: { status: 400, message: '请选择你的班级' } };
  }

  const scorerGroupName = cleanGroupName(req.body.scorer_group_name || req.body.scorerGroupName || req.query.scorer_group_name || req.query.scorerGroupName);
  if (!scorerGroupName) {
    return { error: { status: 400, message: '请填写你的小组' } };
  }

  if (!(await classCanScoreVideo(req.params.id, scorerClassCode))) {
    return { error: { status: 403, message: '当前班级不允许给这个视频评分' } };
  }

  if (
    cleanClassCode(video.class_code) &&
    cleanClassCode(video.class_code) === scorerClassCode &&
    normalizeGroupName(video.team_name) &&
    normalizeGroupName(video.team_name) === normalizeGroupName(scorerGroupName)
  ) {
    return { error: { status: 403, message: '不能给自己小组的视频打分' } };
  }

  return { scorerName, scorerClassCode, scorerGroupName };
}

router.get('/:id/public-score-status', async (req, res) => {
  try {
    const video = await fetchVideo(req.params.id, false);
    const checked = await validatePublicScoreRequest(req, video);
    if (checked.error) {
      return res.status(checked.error.status).json({ message: checked.error.message });
    }

    const [rows] = await db.query(
      'SELECT * FROM video_scores WHERE video_id=? AND scorer_class_code=? AND scorer_name=? LIMIT 1',
      [req.params.id, checked.scorerClassCode, checked.scorerName]
    );

    if (!rows[0]) {
      return res.json({
        exists: false,
        message: '暂无评分记录，可以填写新评分。',
        score: null,
      });
    }

    res.json({
      exists: true,
      message: '已找到你上次提交的评分，可直接修改后替换。',
      score: mapScoreRow(rows[0]),
    });
  } catch (err) {
    console.error('[videos/public-score-status]', err);
    res.status(500).json({ message: '评分记录查询失败' });
  }
});

router.post('/:id/public-score', async (req, res) => {
  try {
    const video = await fetchVideo(req.params.id, false);
    const checked = await validatePublicScoreRequest(req, video);
    if (checked.error) {
      return res.status(checked.error.status).json({ message: checked.error.message });
    }

    const detailedScores = parseDetailedScores(req.body);
    if (!detailedScores) {
      return res.status(400).json({ message: '请按评分表填写所有细项分数' });
    }

    const parts = scoreParts(detailedScores);
    const ip = requestIp(req);
    const userAgent = cleanString(req.headers['user-agent'], 255);
    const detailedColumns = detailedScoreKeys.join(', ');
    const detailedPlaceholders = detailedScoreKeys.map(() => '?').join(', ');
    const detailedUpdates = detailedScoreKeys.map((key) => `${key}=VALUES(${key})`).join(',\n        ');
    const detailedValues = detailedScoreKeys.map((key) => detailedScores[key]);

    await db.query(
      `
      INSERT INTO video_scores
      (video_id, user_id, scorer_name, scorer_class_code, scorer_group_name, scorer_ip, scorer_user_agent, content_score, delivery_score, technical_score, defense_score, comment, ${detailedColumns})
      VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${detailedPlaceholders})
      ON DUPLICATE KEY UPDATE
        scorer_group_name=VALUES(scorer_group_name),
        scorer_ip=VALUES(scorer_ip),
        scorer_user_agent=VALUES(scorer_user_agent),
        content_score=VALUES(content_score),
        delivery_score=VALUES(delivery_score),
        technical_score=VALUES(technical_score),
        defense_score=VALUES(defense_score),
        comment=VALUES(comment),
        ${detailedUpdates},
        updated_at=CURRENT_TIMESTAMP
      `,
      [
        req.params.id,
        checked.scorerName,
        checked.scorerClassCode,
        checked.scorerGroupName,
        ip,
        userAgent,
        parts.self,
        0,
        parts.project,
        parts.answer,
        cleanString(req.body.comment, 2000),
        ...detailedValues,
      ]
    );

    const [rows] = await db.query(
      'SELECT * FROM video_scores WHERE video_id=? AND scorer_class_code=? AND scorer_name=? LIMIT 1',
      [req.params.id, checked.scorerClassCode, checked.scorerName]
    );

    res.json({
      message: '评分已保存，感谢参与。',
      video: await fetchVideo(req.params.id, false),
      score: rows[0] ? mapScoreRow(rows[0]) : null,
    });
  } catch (err) {
    console.error('[videos/public-score]', err);
    res.status(500).json({ message: '评分提交失败' });
  }
});

router.delete('/:id', authRequired, editorOrAdmin, async (req, res) => {
  try {
    const video = await fetchVideo(req.params.id, true);
    if (!video) return res.status(404).json({ message: '视频不存在' });
    if (!isAdminLike(req.user) && Number(video.created_by) !== Number(req.user.id)) {
      return res.status(403).json({ message: '无权限删除这个视频' });
    }

    if (video.video_filename) {
      removeFile(videoPathFor(video.video_filename));
    }

    await db.query('DELETE FROM videos WHERE id=?', [req.params.id]);
    res.json({ message: '视频已删除' });
  } catch (err) {
    console.error('[videos/delete]', err);
    res.status(500).json({ message: '视频删除失败' });
  }
});

module.exports = {
  router,
  videoDir,
};
