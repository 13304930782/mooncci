import { useEffect } from 'react';
import { api } from '../lib/api';
import { initialSiteSettings } from '../config/initialSiteSettings';

const SITE_URL = 'https://mooncci.site';

const defaultBrand = {
  site_title: 'mooncci blog',
  site_subtitle: 'Articles about programming, systems and building things.',
  favicon_url: '',
  logo_url: '',
};

type SeoMeta = {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  tags?: string[];
  jsonLd?: Record<string, unknown>;
};

function getBrand() {
  return {
    ...defaultBrand,
    ...((initialSiteSettings as any).brand || {}),
  };
}

function absoluteUrl(value?: string) {
  if (!value) return '';

  try {
    return new URL(value, SITE_URL).toString();
  } catch {
    return '';
  }
}

function ensureFavicon() {
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  return link;
}

function upsertMeta(selector: string, attrs: Record<string, string>, content?: string) {
  if (!content) return;

  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement('meta');
    Object.entries(attrs).forEach(([key, value]) => element?.setAttribute(key, value));
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function upsertCanonical(url?: string) {
  if (!url) return;

  let link = document.head.querySelector("link[rel='canonical']") as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }

  link.href = url;
}

function upsertJsonLd(data?: Record<string, unknown>) {
  const id = 'mooncci-json-ld';
  let script = document.getElementById(id) as HTMLScriptElement | null;

  if (!data) {
    script?.remove();
    return;
  }

  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
}

function applyMeta(meta: SeoMeta, markCustom: boolean) {
  const brand = getBrand();
  const siteTitle = brand.site_title || defaultBrand.site_title;
  const title = meta.title ? `${meta.title} | ${siteTitle}` : siteTitle;
  const description = meta.description || brand.site_subtitle || defaultBrand.site_subtitle;
  const canonical = absoluteUrl(meta.canonical || window.location.pathname);
  const image = absoluteUrl(meta.image || brand.logo_url);
  const type = meta.type || 'website';

  if (markCustom) {
    document.documentElement.dataset.mooncciSeo = 'custom';
  }

  document.title = title;

  upsertCanonical(canonical);
  upsertMeta("meta[name='description']", { name: 'description' }, description);
  upsertMeta("meta[name='robots']", { name: 'robots' }, 'index,follow');
  upsertMeta("meta[property='og:site_name']", { property: 'og:site_name' }, siteTitle);
  upsertMeta("meta[property='og:title']", { property: 'og:title' }, title);
  upsertMeta("meta[property='og:description']", { property: 'og:description' }, description);
  upsertMeta("meta[property='og:type']", { property: 'og:type' }, type);
  upsertMeta("meta[property='og:url']", { property: 'og:url' }, canonical);
  upsertMeta("meta[name='twitter:card']", { name: 'twitter:card' }, image ? 'summary_large_image' : 'summary');
  upsertMeta("meta[name='twitter:title']", { name: 'twitter:title' }, title);
  upsertMeta("meta[name='twitter:description']", { name: 'twitter:description' }, description);

  if (image) {
    upsertMeta("meta[property='og:image']", { property: 'og:image' }, image);
    upsertMeta("meta[name='twitter:image']", { name: 'twitter:image' }, image);
  }

  if (type === 'article') {
    upsertMeta("meta[property='article:published_time']", { property: 'article:published_time' }, meta.publishedTime);
    upsertMeta("meta[property='article:modified_time']", { property: 'article:modified_time' }, meta.modifiedTime);
    upsertMeta("meta[property='article:author']", { property: 'article:author' }, meta.authorName);
  }

  upsertJsonLd(meta.jsonLd);
}

export function applyPageSeoMeta(meta: SeoMeta) {
  applyMeta(meta, true);
}

export function resetPageSeoMeta() {
  delete document.documentElement.dataset.mooncciSeo;
  applyMeta({}, false);
}

export function SiteMeta() {
  useEffect(() => {
    api('/settings/site')
      .then((data) => {
        const brand = {
          ...getBrand(),
          ...(data.brand || {}),
        };

        if (brand.favicon_url) {
          ensureFavicon().href = absoluteUrl(brand.favicon_url);
        }

        if (document.documentElement.dataset.mooncciSeo !== 'custom') {
          applyMeta({
            title: '',
            description: brand.site_subtitle,
            image: brand.logo_url,
            canonical: '/',
            type: 'website',
          }, false);
        }
      })
      .catch(() => {
        if (document.documentElement.dataset.mooncciSeo !== 'custom') {
          applyMeta({}, false);
        }
      });
  }, []);

  return null;
}
