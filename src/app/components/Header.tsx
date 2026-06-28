import { ChevronDown, Menu, Moon, Search, Sun, UserCircle, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { initialSiteSettings } from '../config/initialSiteSettings';
import { safeImageSrc } from '../lib/safeUrl';
import { fadeUp, fadeUpWithDelay } from '../lib/animations';

const defaultBrand = {
  site_title: 'mooncci Blog',
  nav_title: 'mooncci Blog',
  logo_url: '',
  favicon_url: '',
};

const navLinks = [
  { label: '首页', to: '/' },
  { label: '关于', to: '/#about' },
  { label: '公告', to: '/announcements' },
  { label: '最新', to: '/#latest' },
  { label: '视频', to: '/videos' },
];

const tagSuggestions = ['Web 全栈', 'Linux', 'OpenWrt', 'Nginx', 'MySQL', '部署排障'];

function canEnterAdmin(role?: string) {
  return role === 'owner' || role === 'admin' || role === 'editor' || role === 'teacher';
}

function parseTags(raw: unknown): string[] {
  try {
    if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
    return JSON.parse(String(raw || '[]'));
  } catch {
    return [];
  }
}

export function Header() {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchItems, setSearchItems] = useState<any[]>([]);
  const [brand, setBrand] = useState({ ...defaultBrand, ...(initialSiteSettings.brand || {}) });

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const logoUrl = safeImageSrc(brand.logo_url);
  const adminEntryPath = canEnterAdmin(user?.role) ? '/admin' : '/admin/editor-apply';

  useEffect(() => {
    api('/settings/site')
      .then((data) => setBrand({ ...defaultBrand, ...(data.brand || {}) }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleKeydown = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (event.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  useEffect(() => {
    if (!searchOpen || searchItems.length) return;

    api('/posts')
      .then((rows) => setSearchItems(Array.isArray(rows) ? rows : []))
      .catch(() => setSearchItems([]));
  }, [searchOpen, searchItems.length]);

  const filteredResults = useMemo(() => {
    const query = paletteQuery.trim().toLowerCase();

    if (!query) return searchItems.slice(0, 5);

    return searchItems
      .filter((post) => {
        const tags = parseTags(post.tags).join(' ');
        return `${post.title || ''} ${post.summary || ''} ${tags}`.toLowerCase().includes(query);
      })
      .slice(0, 6);
  }, [paletteQuery, searchItems]);

  const paletteOptions = useMemo(() => {
    if (paletteQuery.trim()) return filteredResults;
    return [
      ...filteredResults,
      ...tagSuggestions.map((tag) => ({ id: `tag-${tag}`, title: tag, isTag: true })),
    ].slice(0, 8);
  }, [filteredResults, paletteQuery]);

  useEffect(() => {
    setActiveIndex(0);
  }, [paletteQuery, searchOpen]);

  const toggleTheme = () => {
    setIsDark((value) => !value);
    document.documentElement.classList.toggle('dark');
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();

    const value = keyword.trim();
    if (!value) return;

    navigate(`/search?q=${encodeURIComponent(value)}`);
    setKeyword('');
    setIsMenuOpen(false);
  };

  const closePalette = () => {
    setSearchOpen(false);
    setPaletteQuery('');
  };

  const choosePaletteItem = (item: any) => {
    if (!item) {
      const value = paletteQuery.trim();
      if (value) navigate(`/search?q=${encodeURIComponent(value)}`);
      closePalette();
      return;
    }

    if (item.isTag) {
      navigate(`/tag/${encodeURIComponent(item.title)}`);
    } else {
      navigate(`/article/${item.id}`);
    }

    closePalette();
  };

  const handlePaletteKeydown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((value) => Math.min(value + 1, Math.max(paletteOptions.length - 1, 0)));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((value) => Math.max(value - 1, 0));
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      choosePaletteItem(paletteOptions[activeIndex]);
    }
  };

  const logoutAndClose = () => {
    logout();
    setAccountOpen(false);
    setIsMenuOpen(false);
  };


  const scrollToHash = (hash: string) => {
    const id = hash.replace('#', '');
    if (!id) return;

    window.setTimeout(() => {
      const element = document.getElementById(id);
      if (!element) return;

      const headerOffset = 108;
      const top = element.getBoundingClientRect().top + window.scrollY - headerOffset;

      animateScrollTo(Math.max(top, 0));
    }, 80);
  };

  const handleHashNav = (to: string) => {
    const hash = to.includes('#') ? to.slice(to.indexOf('#')) : '';

    if (!hash) return false;

    if (location.pathname !== '/') {
      navigate(`/${hash}`);
    } else {
      window.history.pushState(null, '', `/${hash}`);
      scrollToHash(hash);
    }

    setIsMenuOpen(false);
    return true;
  };

  useEffect(() => {
    if (location.hash) {
      scrollToHash(location.hash);
    }
  }, [location.pathname, location.hash]);


  const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

  const animateScrollTo = (targetTop: number) => {
    const startTop = window.scrollY;
    const distance = targetTop - startTop;
    const duration = 420;
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = easeOutCubic(progress);

      window.scrollTo(0, startTop + distance * eased);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };


  const scrollToSection = (to: string) => {
    const hash = to.split('#')[1];

    if (!hash) return;

    const scroll = () => {
      const element = document.getElementById(hash);

      if (!element) return;

      const headerOffset = 104;
      const top = element.getBoundingClientRect().top + window.scrollY - headerOffset;

      animateScrollTo(Math.max(top, 0));
    };

    if (window.location.pathname !== '/') {
      navigate(`/#${hash}`);
      window.setTimeout(scroll, 120);
    } else {
      window.history.pushState(null, '', `/#${hash}`);
      scroll();
    }

    setIsMenuOpen(false);
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="fixed left-0 right-0 top-0 z-50"
      >
        <div className="mx-3 mt-3 rounded-2xl border border-white/80 bg-white/80 shadow-lg shadow-slate-950/5 backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/80 md:mx-6">
          <nav className="px-4 py-3 md:px-6">
            <div className="flex items-center gap-4">
              <Link to="/" className={`flex min-w-0 shrink-0 items-center gap-3 rounded-lg ${focusRing}`}>
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600">
                  {logoUrl ? (
                    <img src={logoUrl} alt={brand.nav_title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-black text-white">
                      M
                    </div>
                  )}
                </div>
                <span className="truncate text-lg font-black tracking-[-0.02em] text-slate-950 dark:text-white">
                  {brand.nav_title || 'mooncci Blog'}
                </span>
              </Link>

              <div className="hidden items-center gap-1 lg:flex">
                {navLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={(event) => {
                      if (item.to.includes('#')) {
                        event.preventDefault();
                        scrollToSection(item.to);
                      }
                    }}
                    className={({ isActive }) =>
                      [
                        `rounded-lg px-4 py-2 text-sm font-semibold transition ${focusRing}`,
                        isActive && !item.to.includes('#')
                          ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                      ].join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>

              <form onSubmit={submitSearch} className="ml-auto hidden max-w-md flex-1 items-center gap-2 rounded-xl border border-white/70 bg-slate-100/80 px-4 py-2.5 shadow-inner shadow-white/40 dark:border-slate-800 dark:bg-slate-900 md:flex">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="搜索文章、标签或关键词…  ⌘K"
                  className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                />
              </form>

              <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
                <button
                  onClick={toggleTheme}
                  className={`rounded-lg bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 ${focusRing}`}
                  aria-label="切换深色模式"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                {user ? (
                  <div className="relative hidden sm:block">
                    <button
                      onClick={() => setAccountOpen((value) => !value)}
                      className={`inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 ${focusRing}`}
                    >
                      <UserCircle className="h-4 w-4" />
                      账户
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>

                    {accountOpen && (
                      <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-950">
                        <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                          {user.username || '已登录'}
                        </div>
                        <Link
                          to={adminEntryPath}
                          onClick={() => setAccountOpen(false)}
                          className={`block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 ${focusRing}`}
                        >
                          {canEnterAdmin(user.role) ? '进入后台' : '编辑申请'}
                        </Link>
                        <button
                          onClick={logoutAndClose}
                          className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 ${focusRing}`}
                        >
                          退出登录
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link to="/login" className={`hidden rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-white dark:text-slate-950 sm:inline-flex ${focusRing}`}>
                    登录
                  </Link>
                )}

                <button
                  onClick={() => setIsMenuOpen((value) => !value)}
                  className={`rounded-lg bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 lg:hidden ${focusRing}`}
                  aria-label="打开菜单"
                >
                  {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isMenuOpen && (
              <motion.div
                {...fadeUp}
                className="mt-4 border-t border-slate-200/70 pt-4 dark:border-slate-800 lg:hidden"
              >
                <form onSubmit={submitSearch} className="mb-3 flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 dark:bg-slate-800">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="搜索文章..."
                    className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-white"
                  />
                </form>

                <div className="grid gap-1">
                  {navLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={(event) => {
                        if (item.to.includes('#')) {
                          event.preventDefault();
                          scrollToSection(item.to);
                          return;
                        }

                        setIsMenuOpen(false);
                      }}
                      className={`rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${focusRing}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {user ? (
                    <>
                      <Link to={adminEntryPath} onClick={() => setIsMenuOpen(false)} className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white ${focusRing}`}>
                        {canEnterAdmin(user.role) ? '进入后台' : '编辑申请'}
                      </Link>
                      <button onClick={logoutAndClose} className={`rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 ${focusRing}`}>
                        退出登录
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setIsMenuOpen(false)} className={`rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white ${focusRing}`}>
                        登录
                      </Link>
                      <Link to="/register" onClick={() => setIsMenuOpen(false)} className={`rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 ${focusRing}`}>
                        注册
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </nav>
        </div>
      </motion.header>

      {searchOpen && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/35 px-4 pt-28 backdrop-blur-md" onMouseDown={closePalette}>
          <motion.div
            {...fadeUpWithDelay(0)}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:bg-slate-950/95"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800">
              <Search className="h-5 w-5 text-blue-600" />
              <input
                autoFocus
                value={paletteQuery}
                onChange={(event) => setPaletteQuery(event.target.value)}
                onKeyDown={handlePaletteKeydown}
                placeholder="搜索文章、标签或关键词…  ⌘K"
                className="w-full bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
              />
              <button onClick={closePalette} className={`rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 ${focusRing}`} aria-label="关闭搜索">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[26rem] overflow-y-auto p-3">
              {paletteOptions.length > 0 ? (
                paletteOptions.map((item, index) => (
                  <button
                    key={item.id}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choosePaletteItem(item)}
                    className={[
                      `flex w-full items-start justify-between gap-4 rounded-xl px-4 py-3 text-left transition ${focusRing}`,
                      index === activeIndex
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/35 dark:text-blue-200'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900',
                    ].join(' ')}
                  >
                    <span>
                      <span className="block text-sm font-bold">{item.isTag ? `# ${item.title}` : item.title}</span>
                      {!item.isTag && item.summary && (
                        <span className="mt-1 line-clamp-1 block text-xs text-slate-500 dark:text-slate-400">
                          {item.summary}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400">{item.isTag ? '标签' : '文章'}</span>
                  </button>
                ))
              ) : (
                <button
                  onClick={() => choosePaletteItem(null)}
                  className={`w-full rounded-xl px-4 py-5 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900 ${focusRing}`}
                >
                  没有直接匹配，按 Enter 搜索“{paletteQuery}”
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
