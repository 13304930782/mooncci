import { ArrowRight, Calendar, Clock, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { defaultHomeSettings, type HomeSettings } from '../lib/homeContent';
import { fadeUp, fadeUpWithDelay } from '../lib/animations';

type HeroProps = {
  featuredPost?: any;
  settings?: HomeSettings;
};

function parseTags(raw: unknown): string[] {
  try {
    if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
    return JSON.parse(String(raw || '[]'));
  } catch {
    return [];
  }
}

function SmartLink({
  to,
  className,
  children,
}: {
  to: string;
  className: string;
  children: ReactNode;
}) {
  const target = to || '/articles';

  if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('#')) {
    return (
      <a href={target} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link to={target} className={className}>
      {children}
    </Link>
  );
}

const Hero = ({ featuredPost, settings }: HeroProps) => {
  const tags = parseTags(featuredPost?.tags).slice(0, 3);
  const home = { ...defaultHomeSettings, ...(settings || {}) };
  const chips = home.hero_chips?.length ? home.hero_chips : defaultHomeSettings.hero_chips;

  return (
    <section
      id="hero"
      className="relative overflow-hidden border-b border-slate-200/70 px-4 pb-7 pt-24 dark:border-slate-800/70 sm:px-6 md:pt-28"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-8 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl dark:bg-blue-900/20" />
        <div className="absolute right-[-8rem] top-20 h-64 w-64 rounded-full bg-slate-200/30 blur-3xl dark:bg-slate-800/30" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <motion.div
          {...fadeUp}
        >
          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-blue-100 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-700 shadow-sm shadow-blue-900/5 backdrop-blur dark:border-blue-900/50 dark:bg-slate-900/80 dark:text-blue-300">
            <GraduationCap className="h-4 w-4" />
            {home.hero_eyebrow}
          </div>

          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[1.06] tracking-[-0.055em] text-slate-950 dark:text-white md:text-[3.75rem] lg:text-[4.25rem]">
            {home.hero_title}
          </h1>

          <p className="mt-4 max-w-2xl text-xl font-semibold leading-8 tracking-[-0.02em] text-slate-800 dark:text-slate-100 md:text-2xl">
            {home.hero_subtitle}
          </p>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            {home.hero_description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <SmartLink
              to={home.primary_cta_url}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-white dark:text-slate-950"
            >
              {home.primary_cta_label}
              <ArrowRight className="h-4 w-4" />
            </SmartLink>

            <SmartLink
              to={home.secondary_cta_url}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-blue-900/50 dark:bg-slate-900/70 dark:text-blue-200"
            >
              {home.secondary_cta_label}
            </SmartLink>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5 text-sm text-slate-500 dark:text-slate-400">
            {chips.map((item) => (
              <span
                key={item}
                className="rounded-lg bg-white/70 px-3 py-1.5 shadow-sm shadow-slate-950/5 dark:bg-slate-900/70"
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.article
          {...fadeUpWithDelay(0.08)}
          className="rounded-xl border border-white/80 border-l-[3px] border-l-blue-600 bg-white/80 p-4 shadow-lg shadow-blue-950/10 backdrop-blur dark:border-slate-800 dark:border-l-blue-500 dark:bg-slate-900/80 md:p-5 lg:mt-6 lg:self-start"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-600 dark:text-blue-300">
              Featured Article
            </p>
            <span className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">
              {home.featured_badge}
            </span>
          </div>

          <h2 className="text-xl font-bold leading-tight tracking-[-0.03em] text-slate-950 dark:text-white md:text-2xl">
            {featuredPost?.title || home.featured_fallback_title}
          </h2>

          <p className="mt-3 line-clamp-3 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
            {featuredPost?.summary || home.featured_fallback_summary}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <Link
                  key={tag}
                  to={'/tag/' + encodeURIComponent(tag)}
                  className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  {tag}
                </Link>
              ))
            ) : (
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800">
                技术笔记
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3 text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {featuredPost?.created_at?.slice(0, 10) || 'mooncci Blog'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                约 3 分钟阅读
              </span>
            </div>

            <Link
              to={featuredPost?.id ? '/article/' + featuredPost.id : '/articles'}
              className="group relative inline-flex w-fit items-center gap-2 font-bold text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              阅读全文
              <ArrowRight className="h-4 w-4" />
              <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-blue-600 transition-transform group-hover:scale-x-100" />
            </Link>
          </div>
        </motion.article>
      </div>
    </section>
  );
};

export { Hero };
export default Hero;
