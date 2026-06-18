#!/usr/bin/env node
/*
  One-time helper: migrate old site_settings.hero/profile into homepage_settings.
  Run from project root: node scripts/migrate-legacy-home-settings.js
*/
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const db = require('../server/src/db');

const defaultHomeSettings = {
  hero_eyebrow: 'Software Engineering Notes',
  hero_title: 'Mooncci Blog',
  hero_subtitle: '记录 Web 开发、Linux、OpenWrt、网络技术、系统设计和项目实践中的经验与踩坑。',
  hero_description: '这里是一份长期积累的工程笔记：从前端界面、后端接口、数据库、部署排障，到路由器和网络监控，把真正踩过的坑写清楚。',
  primary_cta_label: '开始阅读',
  primary_cta_url: '/articles',
  secondary_cta_label: '查看最新文章',
  secondary_cta_url: '#latest',
  hero_chips: ['持续更新中', 'Web / Linux / OpenWrt / 网络', '项目实践'],
  featured_badge: '推荐阅读',
  featured_fallback_title: '精选文章正在准备中',
  featured_fallback_summary: '当有文章发布后，这里会展示最值得先读的一篇内容，让读者第一眼看到真正有价值的技术记录。',
  latest_eyebrow: 'Latest Posts',
  latest_title: '最近更新',
  latest_description: '最新文章放在最前面，方便快速判断这个博客最近在持续写什么。',
  topics_eyebrow: 'Topics',
  topics_title: '技术专栏',
  topics: [],
  about_eyebrow: 'About',
  about_title: '关于作者',
  about_intro: '我是 Mooncci，一名软件工程学生，也是在持续补齐工程能力的全栈开发学习者。',
  about_description: '目前主要关注 Web 开发、网络、系统部署、数据库设计和项目实践。这个博客会尽量把“为什么这么做”“哪里容易坏”“怎么验证”写清楚。',
  about_email: 'websiteaccount@mooncci.site',
  about_github: 'https://github.com/',
};

function safeParse(value, fallback) {
  try { return JSON.parse(value || ''); } catch { return fallback; }
}

function text(value) {
  const next = String(value || '').trim();
  return next || undefined;
}

async function getSetting(key) {
  const [rows] = await db.query('SELECT setting_value FROM site_settings WHERE setting_key=? LIMIT 1', [key]);
  return safeParse(rows[0]?.setting_value, {});
}

async function getHomeSettings() {
  const [rows] = await db.query('SELECT * FROM homepage_settings WHERE id=1 LIMIT 1');
  const row = rows[0] || {};
  return {
    ...defaultHomeSettings,
    ...row,
    hero_chips: safeParse(row.hero_chips_json, defaultHomeSettings.hero_chips),
    topics: safeParse(row.topics_json, defaultHomeSettings.topics),
  };
}

async function main() {
  const hero = await getSetting('hero');
  const profile = await getSetting('profile');
  const current = await getHomeSettings();
  const title = [hero.title_before, hero.title_highlight, hero.title_after].map((item) => String(item || '')).join('').trim();
  const name = text(profile.name);
  const role = text(profile.title);

  const next = {
    ...current,
    hero_eyebrow: text(hero.badge) || current.hero_eyebrow,
    hero_title: title || current.hero_title,
    hero_subtitle: text(hero.subtitle) || current.hero_subtitle,
    primary_cta_label: text(hero.primary_text) || current.primary_cta_label,
    primary_cta_url: text(hero.primary_link) || current.primary_cta_url,
    secondary_cta_label: text(hero.secondary_text) || current.secondary_cta_label,
    secondary_cta_url: text(hero.secondary_link) || current.secondary_cta_url,
    about_title: name ? `关于 ${name}` : current.about_title,
    about_intro: [name, role].filter(Boolean).join(' · ') || current.about_intro,
    about_description: text(profile.bio) || current.about_description,
    about_email: text(profile.email) || current.about_email,
    about_github: text(profile.github_url) || current.about_github,
  };

  await db.query(`
    INSERT INTO homepage_settings
    (id, hero_eyebrow, hero_title, hero_subtitle, hero_description, primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url, hero_chips_json, featured_badge, featured_fallback_title, featured_fallback_summary, latest_eyebrow, latest_title, latest_description, topics_eyebrow, topics_title, topics_json, about_eyebrow, about_title, about_intro, about_description, about_email, about_github)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      hero_eyebrow=VALUES(hero_eyebrow), hero_title=VALUES(hero_title), hero_subtitle=VALUES(hero_subtitle), hero_description=VALUES(hero_description), primary_cta_label=VALUES(primary_cta_label), primary_cta_url=VALUES(primary_cta_url), secondary_cta_label=VALUES(secondary_cta_label), secondary_cta_url=VALUES(secondary_cta_url), hero_chips_json=VALUES(hero_chips_json), featured_badge=VALUES(featured_badge), featured_fallback_title=VALUES(featured_fallback_title), featured_fallback_summary=VALUES(featured_fallback_summary), latest_eyebrow=VALUES(latest_eyebrow), latest_title=VALUES(latest_title), latest_description=VALUES(latest_description), topics_eyebrow=VALUES(topics_eyebrow), topics_title=VALUES(topics_title), topics_json=VALUES(topics_json), about_eyebrow=VALUES(about_eyebrow), about_title=VALUES(about_title), about_intro=VALUES(about_intro), about_description=VALUES(about_description), about_email=VALUES(about_email), about_github=VALUES(about_github)
  `, [
    1,
    next.hero_eyebrow, next.hero_title, next.hero_subtitle, next.hero_description,
    next.primary_cta_label, next.primary_cta_url, next.secondary_cta_label, next.secondary_cta_url,
    JSON.stringify(next.hero_chips || []),
    next.featured_badge, next.featured_fallback_title, next.featured_fallback_summary,
    next.latest_eyebrow, next.latest_title, next.latest_description,
    next.topics_eyebrow, next.topics_title, JSON.stringify(next.topics || []),
    next.about_eyebrow, next.about_title, next.about_intro, next.about_description, next.about_email, next.about_github,
  ]);

  console.log('Legacy site hero/profile migrated into homepage_settings.');
  await db.end?.();
}

main().catch(async (err) => {
  console.error(err);
  try { await db.end?.(); } catch {}
  process.exit(1);
});
