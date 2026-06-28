import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ExternalLink, Megaphone } from 'lucide-react';
import { motion } from 'motion/react';
import { PageShell } from '../components/layout/PageShell';
import { showAppToast } from '../components/AppToast';
import { api } from '../lib/api';
import { fadeUp } from '../lib/animations';

type Announcement = {
  id: number;
  title: string;
  content: string;
  link_label?: string;
  link_url?: string;
  published_at?: string;
  created_at?: string;
};

function formatDate(value?: string) {
  if (!value) return '未标注时间';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function isExternalLink(url?: string) {
  return Boolean(url?.startsWith('http://') || url?.startsWith('https://'));
}

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    api(`/announcements/${id}`)
      .then(setItem)
      .catch((err) => showAppToast(err?.message || '公告加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  const linkUrl = item?.link_url?.trim();
  const linkLabel = item?.link_label?.trim() || '打开相关链接';
  const showRelatedLink = Boolean(linkUrl && linkUrl !== '/articles' && linkUrl !== '/announcements');

  return (
    <PageShell mainClassName="mx-auto max-w-4xl px-4 pb-16 pt-28 sm:px-6 lg:pt-32">
      <motion.article
        {...fadeUp}
        className="rounded-[2rem] border border-white/80 bg-white/85 p-7 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 md:p-10"
      >
        <Link
          to="/announcements"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors duration-300 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" />
          返回公告中心
        </Link>

        {loading && (
          <p className="mt-10 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            正在加载公告...
          </p>
        )}

        {!loading && !item && (
          <p className="mt-10 rounded-2xl bg-rose-50 p-6 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
            公告不存在或已下线。
          </p>
        )}

        {item && (
          <>
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <Megaphone className="h-3.5 w-3.5" />
                NOTICE
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(item.published_at || item.created_at)}
              </span>
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-slate-950 dark:text-white md:text-5xl">
              {item.title}
            </h1>

            <div className="mt-8 whitespace-pre-wrap text-base leading-9 text-slate-700 dark:text-slate-200">
              {item.content}
            </div>

            {showRelatedLink && (
              <div className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
                {isExternalLink(linkUrl) ? (
                  <a
                    href={linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    {linkLabel}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <Link
                    to={linkUrl || '/announcements'}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    {linkLabel}
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </motion.article>
    </PageShell>
  );
}
