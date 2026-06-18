import { Link } from 'react-router-dom';
import { ArrowRight, Megaphone } from 'lucide-react';

export type HomeAnnouncement = {
  id: number;
  title: string;
  content: string;
  link_label?: string;
  link_url?: string;
  pinned?: number;
  published_at?: string;
};

type AnnouncementStripProps = {
  announcement?: HomeAnnouncement;
  announcements?: HomeAnnouncement[];
};

function buildText(item?: HomeAnnouncement) {
  if (!item) {
    return '近期会继续整理 Web 开发、部署排障、OpenWrt 和网络监控相关内容。';
  }

  const title = item.title?.trim();
  const content = item.content?.trim();

  if (title && content) return `${title}：${content}`;
  return title || content || '暂无公告内容';
}

export function AnnouncementStrip({ announcement, announcements }: AnnouncementStripProps) {
  const items = announcements?.length ? announcements : announcement ? [announcement] : [];
  const text = items.length
    ? items.map(buildText).join('　　·　　')
    : buildText();

  return (
    <section id="notice" className="scroll-mt-28 mx-auto max-w-7xl px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3 rounded-2xl border border-blue-100/80 bg-white/72 px-4 py-3 shadow-sm shadow-slate-950/[0.03] backdrop-blur dark:border-blue-900/40 dark:bg-slate-900/60">
        <div className="flex shrink-0 items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
          <Megaphone className="h-3.5 w-3.5" />
          公告
        </div>

        <p className="min-w-0 flex-1 truncate text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
          {text}
        </p>

        <Link
          to="/announcements"
          className="hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-blue-700 transition-colors duration-200 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40 sm:inline-flex"
        >
          全部
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
