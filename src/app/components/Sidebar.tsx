import { motion } from 'motion/react';
import { BookOpen, Tag, User, Github, Twitter, Mail } from 'lucide-react';

export function Sidebar() {
  const categories = [
    { name: '前端开发', count: 12 },
    { name: '后端开发', count: 8 },
    { name: '算法', count: 15 },
    { name: 'AI/ML', count: 6 },
    { name: '系统设计', count: 9 },
  ];

  const popularTags = [
    'React', 'TypeScript', 'Node.js', 'Python', 'Docker',
    'AWS', 'GraphQL', 'PostgreSQL', 'Redis', 'Kubernetes'
  ];

  return (
    <aside className="space-y-6">
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg shadow-black/5"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
              <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                <User className="w-10 h-10 text-gray-400" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">张三</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">全栈开发工程师</p>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            热爱编程，专注于 Web 开发和系统架构设计
          </p>
          <div className="flex gap-2 pt-2">
            {[Github, Twitter, Mail].map((Icon, i) => (
              <motion.a
                key={i}
                href="#"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </motion.a>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg shadow-black/5"
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">分类</h3>
        </div>
        <div className="space-y-2">
          {categories.map((cat, i) => (
            <motion.a
              key={cat.name}
              href="#"
              whileHover={{ x: 4 }}
              className="flex items-center justify-between py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
            >
              <span>{cat.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {cat.count}
              </span>
            </motion.a>
          ))}
        </div>
      </motion.div>

      {/* Popular Tags */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg shadow-black/5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">热门标签</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <motion.a
              key={tag}
              href="#"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200/50 dark:border-gray-700/50 transition-all"
            >
              {tag}
            </motion.a>
          ))}
        </div>
      </motion.div>
    </aside>
  );
}
