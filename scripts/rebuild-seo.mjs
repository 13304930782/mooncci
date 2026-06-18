import fs from 'node:fs/promises';
import path from 'node:path';

const siteUrl = trimTrailingSlash(process.env.SITE_URL || 'https://mooncci.site');
const apiBase = trimTrailingSlash(process.env.API_BASE || `${siteUrl}/api`);
const publicDir = path.resolve(process.cwd(), 'public');

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function xmlEscape(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function urlFor(pathname) {
  return `${siteUrl}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

function normalizeDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function parseTags(raw) {
  try {
    if (Array.isArray(raw)) return raw;
    return JSON.parse(raw || '[]');
  } catch {
    return [];
  }
}

async function getJson(pathname) {
  const res = await fetch(`${apiBase}${pathname}`);

  if (!res.ok) {
    throw new Error(`GET ${pathname} failed: ${res.status}`);
  }

  return res.json();
}

async function getAllPosts() {
  const posts = [];
  const pageSize = 100;

  for (let page = 1; page <= 1000; page += 1) {
    const rows = await getJson(`/posts?page=${page}&pageSize=${pageSize}`);
    if (!Array.isArray(rows) || rows.length === 0) break;

    posts.push(...rows);

    if (rows.length < pageSize) break;
  }

  return posts;
}

function sitemapEntry(location, options = {}) {
  const parts = [
    '  <url>',
    `    <loc>${xmlEscape(location)}</loc>`,
  ];

  if (options.lastmod) {
    parts.push(`    <lastmod>${xmlEscape(options.lastmod)}</lastmod>`);
  }

  if (options.changefreq) {
    parts.push(`    <changefreq>${xmlEscape(options.changefreq)}</changefreq>`);
  }

  if (options.priority) {
    parts.push(`    <priority>${xmlEscape(options.priority)}</priority>`);
  }

  parts.push('  </url>');
  return parts.join('\n');
}

async function main() {
  await fs.mkdir(publicDir, { recursive: true });

  const [posts, categories, tagRows] = await Promise.all([
    getAllPosts(),
    getJson('/posts/meta/categories').catch(() => []),
    getJson('/posts/meta/tags').catch(() => []),
  ]);

  const tags = new Set();
  posts.forEach((post) => parseTags(post.tags).forEach((tag) => tag && tags.add(tag)));
  (Array.isArray(tagRows) ? tagRows : []).forEach((row) => row?.tag && tags.add(row.tag));

  const entries = [
    sitemapEntry(urlFor('/'), { changefreq: 'daily', priority: '1.0' }),
    sitemapEntry(urlFor('/articles'), { changefreq: 'daily', priority: '0.9' }),
    sitemapEntry(urlFor('/categories'), { changefreq: 'weekly', priority: '0.6' }),
    sitemapEntry(urlFor('/tags'), { changefreq: 'weekly', priority: '0.6' }),
  ];

  posts.forEach((post) => {
    entries.push(
      sitemapEntry(urlFor(`/article/${post.id}`), {
        lastmod: normalizeDate(post.updated_at || post.published_at || post.created_at),
        changefreq: 'monthly',
        priority: '0.8',
      }),
    );
  });

  (Array.isArray(categories) ? categories : []).forEach((row) => {
    if (row?.category) {
      entries.push(sitemapEntry(urlFor(`/category/${encodeURIComponent(row.category)}`), {
        changefreq: 'weekly',
        priority: '0.5',
      }));
    }
  });

  Array.from(tags).sort((a, b) => a.localeCompare(b)).forEach((tag) => {
    entries.push(sitemapEntry(urlFor(`/tag/${encodeURIComponent(tag)}`), {
      changefreq: 'weekly',
      priority: '0.5',
    }));
  });

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');

  const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /admin-login',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /forgot-password',
    'Disallow: /reset-password',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');

  await fs.writeFile(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');
  await fs.writeFile(path.join(publicDir, 'robots.txt'), robots, 'utf8');

  console.log(`[seo] wrote public/sitemap.xml (${entries.length} urls)`);
  console.log('[seo] wrote public/robots.txt');
}

main().catch((err) => {
  console.error('[seo] failed:', err.message);
  process.exitCode = 1;
});
