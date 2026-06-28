import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Header } from '../components/Header';
import { SiteFooter } from '../components/SiteFooter';
import { BlogCard } from '../components/BlogCard';
import { api } from '../lib/api';

export default function ArticlesPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/posts')
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 md:p-8"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-slate-400 dark:hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-600 dark:text-blue-300">All Articles</p>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">文章</h1>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            这里收录所有已发布文章。首页只展示最新内容，完整内容会集中在这个独立文章板块中。
          </p>

          {!loading && (
            <p className="mt-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
              共 {posts.length} 篇文章
            </p>
          )}
        </motion.div>

        {loading && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-slate-200/70 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80">
                <div className="aspect-[16/9] animate-pulse bg-slate-200 dark:bg-slate-800" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-5 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="rounded-xl border border-slate-200/70 bg-white/80 p-10 text-center dark:border-slate-800 dark:bg-slate-900/80">
            <p className="text-slate-500">还没有发布文章。</p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {posts.map((post, index) => {
              let tags: string[] = [];
              try { tags = Array.isArray(post.tags) ? post.tags : JSON.parse(post.tags || '[]'); } catch { tags = []; }

              return (
                <motion.div
                  key={post.id}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <BlogCard
                    id={post.id}
                    title={post.title}
                    excerpt={post.summary}
                    date={post.created_at?.slice(0, 10)}
                    readTime="-"
                    tags={tags}
                    image={post.cover_image}
                    index={index}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
