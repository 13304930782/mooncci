import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, ExternalLink, Github, Mail } from 'lucide-react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { BlogCard } from '../components/BlogCard';
import { SiteFooter } from '../components/SiteFooter';
import { AnnouncementStrip, type HomeAnnouncement } from '../components/home/AnnouncementStrip';
import { TopicCard } from '../components/home/TopicCard';
import { pageBackgroundClass } from '../components/layout/PageShell';
import { api } from '../lib/api';
import {
  HOME_SETTINGS_BROADCAST_CHANNEL,
  HOME_SETTINGS_UPDATED_EVENT,
  HOME_SETTINGS_UPDATED_STORAGE_KEY,
  cacheHomeSettings,
  readCachedHomeSettings,
} from '../lib/homeSettingsEvents';
import {
  defaultHomeSettings,
  normalizeHomeSettings,
  type HomeSettings,
} from '../lib/homeContent';

function parseTags(raw: unknown): string[] {
  try {
    if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
    return JSON.parse(String(raw || '[]'));
  } catch {
    return [];
  }
}

export default function HomePage() {
  const [blogPosts, setPosts] = useState<any[]>([]);
  const [homeSettings, setHomeSettings] = useState<HomeSettings>(() => readCachedHomeSettings() || defaultHomeSettings);
  const [homeSettingsReady, setHomeSettingsReady] = useState<boolean>(() => Boolean(readCachedHomeSettings()));
  const [announcements, setAnnouncements] = useState<HomeAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHomeData = useCallback(() => {
    setLoading(true);

    return Promise.all([
      api('/posts').catch(() => []),
      api('/home-settings').catch(() => null),
      api('/announcements').catch(() => []),
    ])
      .then(([posts, settings, noticeRows]) => {
        setPosts(Array.isArray(posts) ? posts : []);

        if (settings) {
          const nextSettings = normalizeHomeSettings(settings);
          setHomeSettings(nextSettings);
          cacheHomeSettings(nextSettings);
        } else {
          setHomeSettings(readCachedHomeSettings() || defaultHomeSettings);
        }

        setHomeSettingsReady(true);
        setAnnouncements(Array.isArray(noticeRows) ? noticeRows : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadHomeData();
  }, [loadHomeData]);

  useEffect(() => {
    const applyHomeSettingsFromEvent = (settings?: unknown) => {
      if (!settings) return;
      const nextSettings = normalizeHomeSettings(settings);
      setHomeSettings(nextSettings);
      cacheHomeSettings(nextSettings);
      setHomeSettingsReady(true);
    };

    const refreshHomeSettings = (event?: Event) => {
      applyHomeSettingsFromEvent((event as CustomEvent<{ settings?: HomeSettings }> | undefined)?.detail?.settings);
      void loadHomeData();
    };

    window.addEventListener(HOME_SETTINGS_UPDATED_EVENT, refreshHomeSettings);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === HOME_SETTINGS_UPDATED_STORAGE_KEY || event.key === null) {
        applyHomeSettingsFromEvent(readCachedHomeSettings());
        refreshHomeSettings();
      }
    };

    window.addEventListener('storage', handleStorage);

    let channel: BroadcastChannel | null = null;

    try {
      channel = new BroadcastChannel(HOME_SETTINGS_BROADCAST_CHANNEL);
      channel.onmessage = (event) => {
        if (event.data?.type === 'updated') {
          applyHomeSettingsFromEvent(event.data.settings);
          refreshHomeSettings();
        }
      };
    } catch {
      channel = null;
    }

    return () => {
      window.removeEventListener(HOME_SETTINGS_UPDATED_EVENT, refreshHomeSettings);
      window.removeEventListener('storage', handleStorage);
      channel?.close();
    };
  }, [loadHomeData]);

  if (!homeSettingsReady) {
    return (
      <div className={pageBackgroundClass}>
        <Header />
        <main className="mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 sm:px-6">
          <div className="w-full rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
            <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="mt-6 h-12 max-w-2xl animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" />
            <div className="mt-4 h-4 max-w-3xl animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="mt-3 h-4 max-w-xl animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-300">正在读取首页设置...</p>
          </div>
        </main>
      </div>
    );
  }

  const featuredPost = blogPosts[0];
  const latestPosts = blogPosts.slice(0, 6);
  const mainAnnouncement = announcements[0];
  const topics = homeSettings.topics.length ? homeSettings.topics : defaultHomeSettings.topics;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={pageBackgroundClass}
    >
      <Header />

      <main>
        <Hero featuredPost={featuredPost} settings={homeSettings} />

        <section id="latest" className="scroll-mt-28 mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-600 dark:text-blue-300">
                {homeSettings.latest_eyebrow}
              </p>
              <h2 className="mt-2 text-[1.75rem] font-bold tracking-[-0.035em] text-slate-950 dark:text-white md:text-[2rem]">
                {homeSettings.latest_title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                {homeSettings.latest_description}
              </p>
            </div>

            <Link
              to="/articles"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-white dark:text-slate-950"
            >
              全部文章
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading && (
            <div className="rounded-xl border border-slate-200/70 bg-white/75 p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900/75">
              正在加载文章...
            </div>
          )}

          {!loading && blogPosts.length === 0 && (
            <div className="rounded-xl border border-slate-200/70 bg-white/75 p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900/75">
              还没有发布文章。
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {latestPosts.map((post, index) => (
              <BlogCard
                key={post.id}
                id={post.id}
                title={post.title}
                excerpt={post.summary}
                date={post.created_at?.slice(0, 10)}
                readTime="约 3 分钟"
                tags={parseTags(post.tags)}
                image={post.cover_image}
                index={index}
              />
            ))}
          </div>
        </section>

        <AnnouncementStrip announcement={mainAnnouncement} announcements={announcements} />

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-600 dark:text-blue-300">
              {homeSettings.topics_eyebrow}
            </p>
            <h2 className="mt-2 text-[1.75rem] font-bold tracking-[-0.035em] text-slate-950 dark:text-white md:text-[2rem]">
              {homeSettings.topics_title}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {topics.map((item) => (
              <TopicCard key={item.title} topic={item} />
            ))}
          </div>
        </section>

        <section id="about" className="scroll-mt-28 mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 rounded-xl border border-white/80 bg-white/80 p-6 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 md:grid-cols-[0.75fr_1.25fr] md:p-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-600 dark:text-blue-300">
                {homeSettings.about_eyebrow}
              </p>
              <h2 className="mt-3 text-[1.75rem] font-bold tracking-[-0.035em] text-slate-950 dark:text-white md:text-[2rem]">
                {homeSettings.about_title}
              </h2>
            </div>

            <div>
              <p className="text-lg font-semibold leading-9 text-slate-800 dark:text-slate-100">
                {homeSettings.about_intro}
              </p>
              <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300">
                {homeSettings.about_description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/articles" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition-colors duration-300 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-white dark:text-slate-950">
                  <BookOpen className="h-4 w-4" />
                  阅读文章
                </Link>
                <a href={'mailto:' + homeSettings.about_email} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors duration-300 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                  <Mail className="h-4 w-4" />
                  Email
                </a>
                <a href={homeSettings.about_github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors duration-300 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                  <Github className="h-4 w-4" />
                  GitHub
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </motion.div>
  );
}
