import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { initialSiteSettings } from '../config/initialSiteSettings';
import { safeHref, safeImageSrc } from '../lib/safeUrl';

const defaultFooter = {
  copyright: 'Copyright mooncci Blog',
  icp_text: '',
  icp_url: 'https://beian.miit.gov.cn/',
  police_text: '',
  police_url: '',
  police_icon_url: '',
};

const defaultBrand = {
  nav_title: 'mooncci Blog',
  logo_url: '',
};

const quickLinks = [
  { label: '首页', to: '/' },
  { label: '文章', to: '/articles' },
  { label: '视频', to: '/videos' },
  { label: '公告', to: '/announcements' },
  { label: '标签', to: '/tags' },
  { label: '分类', to: '/categories' },
];

export function SiteFooter() {
  const [footer, setFooter] = useState({ ...defaultFooter, ...(initialSiteSettings.footer || {}) });
  const [brand, setBrand] = useState({ ...defaultBrand, ...(initialSiteSettings.brand || {}) });
  const icpUrl = safeHref(footer.icp_url || defaultFooter.icp_url, defaultFooter.icp_url);
  const policeUrl = safeHref(footer.police_url || '', '');
  const policeIconUrl = safeImageSrc(footer.police_icon_url);
  const logoUrl = safeImageSrc(brand.logo_url);

  useEffect(() => {
    api('/settings/site')
      .then((data) => {
        setFooter({ ...defaultFooter, ...(data.footer || {}) });
        setBrand({ ...defaultBrand, ...(data.brand || {}) });
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-slate-200/70 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="h-9 w-9 overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600">
              {logoUrl ? (
                <img src={logoUrl} alt={brand.nav_title || 'mooncci'} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-black text-white">m</div>
              )}
            </div>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">
              {brand.nav_title || 'mooncci Blog'} — 个人博客与班级答辩视频评审平台。
            </p>
          </div>

          <nav aria-label="快速导航" className="flex flex-wrap gap-x-8 gap-y-2">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm text-slate-500 transition hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-slate-400 dark:hover:text-blue-300"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-200/70 pt-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row">
          <p>{footer.copyright}</p>

          <p className="flex flex-wrap items-center justify-center gap-4">
            {footer.icp_text && (
              <a href={icpUrl} target="_blank" rel="noreferrer" className="hover:text-blue-600 dark:hover:text-blue-300">
                {footer.icp_text}
              </a>
            )}
            {footer.police_text && policeUrl && (
              <a href={policeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-300">
                {policeIconUrl && <img src={policeIconUrl} alt="公安备案图标" className="h-4 w-4 object-contain" />}
                {footer.police_text}
              </a>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
