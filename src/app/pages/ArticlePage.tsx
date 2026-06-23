import { ArrowLeft, Calendar, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { MarkdownContent } from '../components/MarkdownContent';
import { CommentSection } from '../components/CommentSection';
import { applyPageSeoMeta, resetPageSeoMeta } from '../components/SiteMeta';
import { api } from '../lib/api';
import { showAppToast } from '../components/AppToast';

const SITE_URL = 'https://mooncci.site';

function parseTags(raw: unknown): string[] {
  try {
    if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
    return JSON.parse(String(raw || '[]'));
  } catch {
    return [];
  }
}

function stripMarkdown(input: string) {
  return String(input || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createDescription(post: any) {
  const text = String(post?.summary || '').trim() || stripMarkdown(post?.content || '');
  return text.length > 150 ? `${text.slice(0, 147)}...` : text;
}

function absoluteUrl(value?: string) {
  if (!value) return '';

  try {
    return new URL(value, SITE_URL).toString();
  } catch {
    return '';
  }
}

export default function ArticlePage() {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) return undefined;

    let active = true;
    setPost(null);
    showAppToast('正在加载文章...');

    api(`/posts/${id}`)
      .then((data) => {
        if (!active) return;

        setPost(data);
        setMessage('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch((err) => {
        if (!active) return;
        showAppToast(err.message || '文章加载失败');
      });

    return () => {
      active = false;
      resetPageSeoMeta();
    };
  }, [id]);

  const tags = useMemo(() => parseTags(post?.tags), [post?.tags]);

  useEffect(() => {
    if (!post) return;

    const description = createDescription(post);
    const canonical = `/article/${post.id}`;
    const image = absoluteUrl(post.cover_image);
    const publishedTime = post.published_at || post.created_at;
    const modifiedTime = post.updated_at || publishedTime;

    applyPageSeoMeta({
      title: post.title,
      description,
      canonical,
      image,
      type: 'article',
      publishedTime,
      modifiedTime,
      authorName: post.author_name,
      tags,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description,
        image: image ? [image] : undefined,
        datePublished: publishedTime,
        dateModified: modifiedTime,
        author: {
          '@type': 'Person',
          name: post.author_name || 'Mooncci',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Mooncci Blog',
          url: SITE_URL,
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': absoluteUrl(canonical),
        },
        keywords: tags.join(','),
      },
    });
  }, [post, tags]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Header />

      <main className="px-6 pt-32 pb-20">
        <motion.article
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto rounded-3xl bg-white/85 dark:bg-gray-900/85 backdrop-blur border border-white/40 dark:border-gray-800 p-8 md:p-12 shadow-xl"
        >
          <Link to="/articles" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            返回文章列表
          </Link>

          {message && (
            <div className="mt-8 rounded-xl bg-blue-50 px-4 py-3 text-blue-700">
              {message}
            </div>
          )}

          {post && (
            <>
              {post.cover_image && (
                <motion.img
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  src={post.cover_image}
                  alt={post.title}
                  className="mt-8 w-full max-h-[420px] object-cover rounded-3xl"
                />
              )}

              {tags.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/tag/${encodeURIComponent(tag)}`}
                      className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-800/50"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              <h1 className="mt-5 text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                {post.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{post.author_name || '作者'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{post.published_at?.slice(0, 10) || post.created_at?.slice(0, 10)}</span>
                </div>

                {post.category && (
                  <Link to={`/category/${encodeURIComponent(post.category)}`} className="hover:text-blue-600">
                    分类：{post.category}
                  </Link>
                )}
              </div>

              {post.summary && (
                <p className="mt-8 rounded-2xl bg-gray-50 dark:bg-gray-800/60 px-5 py-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                  {post.summary}
                </p>
              )}

              <MarkdownContent content={post.content || ''} />
            </>
          )}
        </motion.article>

        {post && <CommentSection postId={post.id} />}
      </main>
    </div>
  );
}
