import { BookOpen, Github, Mail, Tag, Twitter, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { initialSiteSettings } from '../config/initialSiteSettings';
import { safeHref, safeImageSrc, safeMailto } from '../lib/safeUrl';
import { fadeUp, fadeUpWithDelay } from '../lib/animations';

const defaultProfile = {
  name: 'mooncci',
  title: '独立开发者 / 博客站长',
  bio: '记录工程实践、网站构建、运维排查和长期思考。',
  avatar_url: '',
  github_url: '',
  twitter_url: '',
  email: '',
};

export function Sidebar() {
  const [profile, setProfile] = useState({ ...defaultProfile, ...(initialSiteSettings.profile || {}) });
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const avatarUrl = safeImageSrc(profile.avatar_url);
  const githubUrl = safeHref(profile.github_url, '');
  const twitterUrl = safeHref(profile.twitter_url, '');
  const emailUrl = safeMailto(profile.email);

  useEffect(() => {
    api('/settings/site')
      .then((data) => setProfile({ ...defaultProfile, ...(data.profile || {}) }))
      .catch(() => {});

    api('/posts/meta/categories')
      .then(setCategories)
      .catch(() => setCategories([]));

    api('/posts/meta/tags')
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  return (
    <div className="space-y-5">
      <motion.aside
        {...fadeUp}
        className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[1rem] bg-white dark:bg-gray-900">
              {avatarUrl ? (
                <img src={avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-7 w-7 text-gray-400" />
              )}
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-gray-950 dark:text-white">{profile.name}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{profile.title}</p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-7 text-gray-600 dark:text-gray-300">
          {profile.bio}
        </p>

        {(githubUrl || twitterUrl || emailUrl) && (
          <div className="mt-5 flex gap-2">
            {githubUrl && (
              <a href={githubUrl} target="_blank" rel="noreferrer" className="rounded-full bg-gray-100 p-2 text-gray-500 transition hover:text-blue-700 dark:bg-gray-800">
                <Github className="h-4 w-4" />
              </a>
            )}
            {twitterUrl && (
              <a href={twitterUrl} target="_blank" rel="noreferrer" className="rounded-full bg-gray-100 p-2 text-gray-500 transition hover:text-blue-700 dark:bg-gray-800">
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {emailUrl && (
              <a href={emailUrl} className="rounded-full bg-gray-100 p-2 text-gray-500 transition hover:text-blue-700 dark:bg-gray-800">
                <Mail className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </motion.aside>

      <motion.aside
        {...fadeUpWithDelay(0.08)}
        className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-gray-950 dark:text-white">分类</h3>
          </div>
          <Link to="/categories" className="text-xs font-semibold text-blue-600 hover:underline">全部</Link>
        </div>

        <div className="space-y-2">
          {categories.length === 0 && <p className="text-sm text-gray-500">暂无分类</p>}
          {categories.slice(0, 8).map((item) => (
            <Link
              key={item.category}
              to={`/category/${encodeURIComponent(item.category)}`}
              className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm text-gray-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/20"
            >
              <span>{item.category}</span>
              <span className="text-xs text-gray-400">{item.count}</span>
            </Link>
          ))}
        </div>
      </motion.aside>

      <motion.aside
        {...fadeUpWithDelay(0.16)}
        className="rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm shadow-gray-950/5 dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-purple-600" />
          <h3 className="font-bold text-gray-950 dark:text-white">标签</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.length === 0 && <p className="text-sm text-gray-500">暂无标签</p>}
          {tags.slice(0, 14).map((item) => (
            <Link
              key={item.tag}
              to={`/tag/${encodeURIComponent(item.tag)}`}
              className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-gray-800 dark:text-gray-300"
            >
              {item.tag}
            </Link>
          ))}
        </div>
      </motion.aside>
    </div>
  );
}
