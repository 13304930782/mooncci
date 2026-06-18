import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { initialSiteSettings } from '../config/initialSiteSettings';
import { safeHref, safeImageSrc } from '../lib/safeUrl';

const defaultFooter = {
  copyright: 'Copyright Mooncci Blog',
  icp_text: '',
  icp_url: 'https://beian.miit.gov.cn/',
  police_text: '',
  police_url: '',
  police_icon_url: '',
};

export function SiteFooter() {
  const [footer, setFooter] = useState({ ...defaultFooter, ...(initialSiteSettings.footer || {}) });
  const icpUrl = safeHref(footer.icp_url || defaultFooter.icp_url, defaultFooter.icp_url);
  const policeUrl = safeHref(footer.police_url || '', '');
  const policeIconUrl = safeImageSrc(footer.police_icon_url);

  useEffect(() => {
    api('/settings/site')
      .then((data) => setFooter({ ...defaultFooter, ...(data.footer || {}) }))
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-gray-200/70 bg-white/70 px-6 py-8 text-center backdrop-blur dark:border-gray-800 dark:bg-gray-950/70">
      {footer.copyright && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {footer.copyright}
        </p>
      )}

      <p className="mt-4 flex flex-col items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 md:flex-row md:gap-6">
        {footer.icp_text && (
          <a href={icpUrl} target="_blank" rel="noreferrer" className="rounded-lg hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            {footer.icp_text}
          </a>
        )}

        {footer.police_text && policeUrl && (
          <a href={policeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-lg hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            {policeIconUrl && <img src={policeIconUrl} alt="公安备案图标" className="h-4 w-4 object-contain" />}
            <span>{footer.police_text}</span>
          </a>
        )}
      </p>
    </footer>
  );
}
