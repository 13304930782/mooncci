import { motion } from 'motion/react';
import { ArrowUpRight, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { safeImageSrc } from '../lib/safeUrl';

interface BlogCardProps {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  image: string;
  index: number;
}

export function BlogCard({ id, title, excerpt, date, readTime, tags, image, index }: BlogCardProps) {
  const coverSrc = safeImageSrc(image);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: index * 0.04, duration: 0.32 }}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white/80 shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-900"
    >
      <Link to={'/article/' + id} className="block aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-blue-50 via-indigo-50/60 to-slate-100 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-slate-900" />
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag) => (
            <Link
              key={tag}
              to={'/tag/' + encodeURIComponent(tag)}
              className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-950/40 dark:text-blue-200"
            >
              {tag}
            </Link>
          ))}
        </div>

        <Link
          to={'/article/' + id}
          className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-[-0.02em] text-slate-950 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
            {title}
          </h3>
        </Link>

        <p className="mt-2.5 line-clamp-2 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {excerpt}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex flex-wrap gap-3 text-[12px] text-slate-400 dark:text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {date}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {readTime}
            </span>
          </div>
          <Link
            to={'/article/' + id}
            className="group/link inline-flex items-center gap-1 text-xs font-bold text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-blue-300"
          >
            阅读
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
