import { FormEvent, useEffect, useState } from 'react';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { showAppToast } from '../components/AppToast';
import { useAuth } from '../context/AuthContext';
import { clearAuthCache } from '../lib/authToken';
import { safeRoutePath } from '../lib/safeUrl';

const DEFAULT_REDIRECT = '/admin/comments?status=pending';
const REMEMBER_EMAIL_KEY = 'mooncci_admin_review_email';

export default function AdminLoginPage() {
  const [params] = useSearchParams();
  const redirect = safeAdminRedirect(params.get('redirect'));
  const { login, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_EMAIL_KEY) || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !user || !['owner', 'admin'].includes(user.role)) return;
    goToRedirect(redirect);
  }, [authLoading, redirect, user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      showAppToast('请填写管理员邮箱和密码。', 'error');
      return;
    }

    setLoading(true);

    try {
      clearAuthCache();
      const loggedInUser = await login(email, password);

      if (!['owner', 'admin'].includes(loggedInUser.role)) {
        clearAuthCache();
        showAppToast('这个账号不是站长或管理员账号，不能进入评论审核后台。', 'error');
        return;
      }

      localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim().toLowerCase());
      goToRedirect(redirect);
    } catch (err: any) {
      showAppToast(err.message || '登录失败。', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 px-6 py-10">
      <div className="w-full max-w-md rounded-[2rem] bg-white/95 p-8 shadow-2xl">
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          返回首页
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">管理员审核登录</h1>
            <p className="mt-1 text-sm text-gray-500">
              仅站长或管理员账号可以进入评论审核页面。
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              管理员邮箱
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
              <Mail className="h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="username"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              管理员密码
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
              <Lock className="h-5 w-5 text-gray-400" />
              <input
                type="password"
                name="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入管理员密码"
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? '登录中...' : '登录并进入审核'}
          </button>
        </form>
      </div>
    </div>
  );
}

function goToRedirect(redirect: string) {
  const target = redirect.includes('?')
    ? `${redirect}&admin_login=${Date.now()}`
    : `${redirect}?admin_login=${Date.now()}`;

  window.location.replace(target);
}

function safeAdminRedirect(input: string | null) {
  const target = safeRoutePath(input, DEFAULT_REDIRECT);

  if (
    target === '/admin' ||
    target.startsWith('/admin/') ||
    target.startsWith('/admin?')
  ) {
    return target;
  }

  return DEFAULT_REDIRECT;
}
