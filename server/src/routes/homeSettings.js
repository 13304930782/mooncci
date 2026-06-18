const express = require('express');
const db = require('../db');
const { authRequired, adminOnly } = require('../middleware/auth');

const router = express.Router();

const defaultHomeSettings = {
  hero_eyebrow: 'Software Engineering Notes',
  hero_title: 'mooncci Blog',
  hero_subtitle: '记录 Web 开发、Linux、OpenWrt、网络技术、系统设计和项目实践中的经验与踩坑。',
  hero_description:
    '这里是一份长期积累的工程笔记：从前端界面、后端接口、数据库、部署排障，到路由器和网络监控，把真正踩过的坑写清楚。',
  primary_cta_label: '开始阅读',
  primary_cta_url: '/articles',
  secondary_cta_label: '查看最新文章',
  secondary_cta_url: '#latest',
  hero_chips: ['持续更新中', 'Web / Linux / OpenWrt / 网络', '项目实践'],
  featured_badge: '推荐阅读',
  featured_fallback_title: '精选文章正在准备中',
  featured_fallback_summary:
    '当有文章发布后，这里会展示最值得先读的一篇内容，让读者第一眼看到真正有价值的技术记录。',
  latest_eyebrow: 'Latest Posts',
  latest_title: '最近更新',
  latest_description: '最新文章放在最前面，方便快速判断这个博客最近在持续写什么。',
  topics_eyebrow: 'Topics',
  topics_title: '技术专栏',
  topics: [
    {
      title: 'Web 全栈开发',
      description: 'React、Node.js、接口设计、前后端协作，以及真实项目里的工程细节。',
      icon: 'code',
      to: '/category/Web 全栈开发',
    },
    {
      title: 'Linux / OpenWrt',
      description: '服务器部署、路由器折腾、服务监控，以及系统层面的排障记录。',
      icon: 'terminal',
      to: '/category/Linux',
    },
    {
      title: '网络技术',
      description: 'Nginx、Cloudflare、反向代理、连接跟踪和家庭网络实践。',
      icon: 'network',
      to: '/category/网络技术',
    },
    {
      title: '数据库 / 软件工程',
      description: 'MySQL 表结构、迁移、权限边界、测试和长期维护的方法。',
      icon: 'database',
      to: '/category/数据库',
    },
    {
      title: '项目实践',
      description: '把一个个人站从能跑，整理到安全、可部署、可持续维护。',
      icon: 'server',
      to: '/articles',
    },
  ],
  about_eyebrow: 'About',
  about_title: '关于作者',
  about_intro: '我是 Mooncci，一名软件工程学生，也是在持续补齐工程能力的全栈开发学习者。',
  about_description:
    '目前主要关注 Web 开发、网络、系统部署、数据库设计和项目实践。这个博客会尽量把“为什么这么做”“哪里容易坏”“怎么验证”写清楚。',
  about_email: 'websiteaccount@mooncci.site',
  about_github: 'https://github.com/',
};

function safeJsonParse(value, fallback) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return value;

  try {
    return JSON.parse(value || '');
  } catch {
    return fallback;
  }
}

function cleanString(value, fallback = '', maxLength = 1000) {
  const next = value == null ? fallback : String(value);
  return next.trim().slice(0, maxLength);
}

function cleanList(value, fallback) {
  if (!Array.isArray(value)) return fallback;

  const list = value.map((item) => cleanString(item, '', 80)).filter(Boolean);
  return list.length ? list.slice(0, 8) : fallback;
}

function cleanTopics(value, fallback) {
  if (!Array.isArray(value)) return fallback;

  const topics = value
    .map((item) => ({
      title: cleanString(item?.title, '', 80),
      description: cleanString(item?.description, '', 300),
      icon: cleanString(item?.icon, 'code', 30),
      to: cleanString(item?.to, '/articles', 255),
    }))
    .filter((item) => item.title && item.description && item.to);

  return topics.length ? topics.slice(0, 12) : fallback;
}

function normalizeHomeSettings(row) {
  const source = row || {};

  return {
    hero_eyebrow: cleanString(source.hero_eyebrow, defaultHomeSettings.hero_eyebrow, 120),
    hero_title: cleanString(source.hero_title, defaultHomeSettings.hero_title, 160),
    hero_subtitle: cleanString(source.hero_subtitle, defaultHomeSettings.hero_subtitle, 500),
    hero_description: cleanString(source.hero_description, defaultHomeSettings.hero_description, 2000),
    primary_cta_label: cleanString(source.primary_cta_label, defaultHomeSettings.primary_cta_label, 80),
    primary_cta_url: cleanString(source.primary_cta_url, defaultHomeSettings.primary_cta_url, 255),
    secondary_cta_label: cleanString(source.secondary_cta_label, defaultHomeSettings.secondary_cta_label, 80),
    secondary_cta_url: cleanString(source.secondary_cta_url, defaultHomeSettings.secondary_cta_url, 255),
    hero_chips: cleanList(safeJsonParse(source.hero_chips_json, source.hero_chips), defaultHomeSettings.hero_chips),
    featured_badge: cleanString(source.featured_badge, defaultHomeSettings.featured_badge, 80),
    featured_fallback_title: cleanString(source.featured_fallback_title, defaultHomeSettings.featured_fallback_title, 200),
    featured_fallback_summary: cleanString(source.featured_fallback_summary, defaultHomeSettings.featured_fallback_summary, 1000),
    latest_eyebrow: cleanString(source.latest_eyebrow, defaultHomeSettings.latest_eyebrow, 80),
    latest_title: cleanString(source.latest_title, defaultHomeSettings.latest_title, 120),
    latest_description: cleanString(source.latest_description, defaultHomeSettings.latest_description, 500),
    topics_eyebrow: cleanString(source.topics_eyebrow, defaultHomeSettings.topics_eyebrow, 80),
    topics_title: cleanString(source.topics_title, defaultHomeSettings.topics_title, 120),
    topics: cleanTopics(safeJsonParse(source.topics_json, source.topics), defaultHomeSettings.topics),
    about_eyebrow: cleanString(source.about_eyebrow, defaultHomeSettings.about_eyebrow, 80),
    about_title: cleanString(source.about_title, defaultHomeSettings.about_title, 120),
    about_intro: cleanString(source.about_intro, defaultHomeSettings.about_intro, 500),
    about_description: cleanString(source.about_description, defaultHomeSettings.about_description, 2000),
    about_email: cleanString(source.about_email, defaultHomeSettings.about_email, 160),
    about_github: cleanString(source.about_github, defaultHomeSettings.about_github, 255),
  };
}

async function loadHomeSettings() {
  try {
    const [rows] = await db.query('SELECT * FROM homepage_settings WHERE id=1 LIMIT 1');
    return normalizeHomeSettings(rows[0] || defaultHomeSettings);
  } catch (err) {
    if (err?.code === 'ER_NO_SUCH_TABLE') {
      return defaultHomeSettings;
    }

    throw err;
  }
}

router.get('/', async (_req, res) => {
  const settings = await loadHomeSettings();
  res.json(settings);
});

router.put('/', authRequired, adminOnly, async (req, res) => {
  const settings = normalizeHomeSettings(req.body || {});

  await db.query(
    `
    INSERT INTO homepage_settings
    (
      id,
      hero_eyebrow,
      hero_title,
      hero_subtitle,
      hero_description,
      primary_cta_label,
      primary_cta_url,
      secondary_cta_label,
      secondary_cta_url,
      hero_chips_json,
      featured_badge,
      featured_fallback_title,
      featured_fallback_summary,
      latest_eyebrow,
      latest_title,
      latest_description,
      topics_eyebrow,
      topics_title,
      topics_json,
      about_eyebrow,
      about_title,
      about_intro,
      about_description,
      about_email,
      about_github
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      hero_eyebrow=VALUES(hero_eyebrow),
      hero_title=VALUES(hero_title),
      hero_subtitle=VALUES(hero_subtitle),
      hero_description=VALUES(hero_description),
      primary_cta_label=VALUES(primary_cta_label),
      primary_cta_url=VALUES(primary_cta_url),
      secondary_cta_label=VALUES(secondary_cta_label),
      secondary_cta_url=VALUES(secondary_cta_url),
      hero_chips_json=VALUES(hero_chips_json),
      featured_badge=VALUES(featured_badge),
      featured_fallback_title=VALUES(featured_fallback_title),
      featured_fallback_summary=VALUES(featured_fallback_summary),
      latest_eyebrow=VALUES(latest_eyebrow),
      latest_title=VALUES(latest_title),
      latest_description=VALUES(latest_description),
      topics_eyebrow=VALUES(topics_eyebrow),
      topics_title=VALUES(topics_title),
      topics_json=VALUES(topics_json),
      about_eyebrow=VALUES(about_eyebrow),
      about_title=VALUES(about_title),
      about_intro=VALUES(about_intro),
      about_description=VALUES(about_description),
      about_email=VALUES(about_email),
      about_github=VALUES(about_github)
    `,
    [
      1,
      settings.hero_eyebrow,
      settings.hero_title,
      settings.hero_subtitle,
      settings.hero_description,
      settings.primary_cta_label,
      settings.primary_cta_url,
      settings.secondary_cta_label,
      settings.secondary_cta_url,
      JSON.stringify(settings.hero_chips),
      settings.featured_badge,
      settings.featured_fallback_title,
      settings.featured_fallback_summary,
      settings.latest_eyebrow,
      settings.latest_title,
      settings.latest_description,
      settings.topics_eyebrow,
      settings.topics_title,
      JSON.stringify(settings.topics),
      settings.about_eyebrow,
      settings.about_title,
      settings.about_intro,
      settings.about_description,
      settings.about_email,
      settings.about_github,
    ]
  );

  res.json({ message: '首页设置已保存。', settings });
});

module.exports = router;
