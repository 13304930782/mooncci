import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Megaphone, Pin } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { api } from '../lib/api';
import { showAppToast } from '../components/AppToast';

type Announcement = {
  id: number;
  title: string;
  content: string;
  link_label?: string;
  link_url?: string;
  pinned?: number;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
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

function AnnouncementAction({ item }: { item: Announcement }) {
  const url = item.link_url?.trim();
  const label = item.link_label?.trim() || '查看详情';

  if (!url) return null;

  const className =
    'inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors duration-300 hover:border-blue-300 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300';

  if (isExternalLink(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className={className}>
        {label}
        <ArrowRight className="h-4 w-4" />
      </a>
    );
  }

  return (
    <Link to={url} className={className}>
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/announcements?limit=100')
      .then((rows) => {
        setItems(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        showAppToast(err?.message || '公告加载失败');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell mainClassName="mx-auto max-w-5xl px-4 pb-16 pt-28 sm:px-6 lg:pt-32">
      <section className="rounded-[2rem] border border-white/80 bg-white/85 p-7 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 md:p-9">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors duration-300 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>

        <div className="mt-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
              NOTICE
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white md:text-5xl">
              公告中心
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              这里集中展示站点更新、维护通知、内容调整和重要说明。
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            <Megaphone className="h-4 w-4" />
            {items.length} 条公告
          </div>
        </div>
      </section>

      <section className="mt-8 space-y-5">
        {loading && (
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
            正在加载公告...
          </div>
        )}

        {!loading && message && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            {message}
          </div>
        )}

        {!loading && !message && items.length === 0 && (
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
            暂无已发布公告。
          </div>
        )}

        {items.map((item) => (
          <article
            key={item.id}
            className="relative overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/86 p-6 shadow-sm shadow-slate-950/5 transition-colors duration-300 hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900/82 dark:hover:border-blue-900/70"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {item.pinned ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      <Pin className="h-3.5 w-3.5" />
                      置顶
                    </span>
                  ) : null}

                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(item.published_at || item.created_at)}
                  </span>
                </div>

                <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                  {item.title}
                </h2>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-600 dark:text-slate-300">
                  {item.content}
                </p>
              </div>

              <div className="shrink-0">
                <AnnouncementAction item={item} />
              </div>
            </div>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
