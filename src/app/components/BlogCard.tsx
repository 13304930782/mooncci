import { motion } from 'motion/react';
import { ArrowUpRight, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export function BlogCard({ id, title, excerpt, date, readTime, tags, index }: BlogCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: index * 0.04, duration: 0.32 }}
      className="group flex h-full flex-col rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-900 sm:p-5"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {tags.slice(0, 3).map((tag) => (
          <Link
            key={tag}
            to={'/tag/' + encodeURIComponent(tag)}
            className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-950/40 dark:text-blue-200"
          >
            {tag}
          </Link>
        ))}
      </div>

      <Link
        to={'/article/' + id}
        className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <h3 className="line-clamp-2 text-xl font-bold leading-snug tracking-[-0.03em] text-slate-950 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
          {title}
        </h3>
      </Link>

      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
        {excerpt}
      </p>

      <div className="mt-5 flex flex-wrap gap-3 text-[13px] text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {date}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {readTime}
        </span>
      </div>

      <Link
        to={'/article/' + id}
        className="group/link relative mt-5 inline-flex w-fit items-center gap-2 text-sm font-bold text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-blue-300"
      >
        阅读全文
        <ArrowUpRight className="h-4 w-4 transition group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
        <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-blue-600 transition-transform group-hover/link:scale-x-100 dark:bg-blue-300" />
      </Link>
    </motion.article>
  );
}
