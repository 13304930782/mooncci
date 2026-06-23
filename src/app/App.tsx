import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SiteMeta } from './components/SiteMeta';
import { MooncciLoadingScreen } from './components/MooncciLoadingScreen';
import { AppToastHost } from './components/AppToast';
import { useInertialScroll } from './lib/useInertialScroll';

const HomePage = lazy(() => import('./pages/HomePage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'));
const TagPage = lazy(() => import('./pages/TagPage'));
const TagsPage = lazy(() => import('./pages/TagsPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const VideosPage = lazy(() => import('./pages/VideosPage'));
const VideoDetailPage = lazy(() => import('./pages/VideoDetailPage'));

const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

const AdminShell = lazy(() => import('./components/admin/AdminShell'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminPostsPage = lazy(() => import('./pages/AdminPostsPage'));
const AdminWritePage = lazy(() => import('./pages/AdminWritePage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminCommentsPage = lazy(() => import('./pages/AdminCommentsPage'));
const AdminBannedWordsPage = lazy(() => import('./pages/AdminBannedWordsPage'));
const EditorApplyPage = lazy(() => import('./pages/EditorApplyPage'));
const AdminEditorApplicationsPage = lazy(() => import('./pages/AdminEditorApplicationsPage'));
const AdminSiteSettingsPage = lazy(() => import('./pages/AdminSiteSettingsPage'));
const AdminMailSettingsPage = lazy(() => import('./pages/AdminMailSettingsPage'));
const AdminSendMailPage = lazy(() => import('./pages/AdminSendMailPage'));
const AdminMediaPage = lazy(() => import('./pages/AdminMediaPage'));
const AdminVideosPage = lazy(() => import('./pages/AdminVideosPage'));
const AdminRouterMonitorPage = lazy(() => import('./pages/AdminRouterMonitorPage'));
const AdminHomeSettingsPage = lazy(() => import('./pages/AdminHomeSettingsPage'));
const AdminAnnouncementsPage = lazy(() => import('./pages/AdminAnnouncementsPage'));

function isAdminRole(role?: string) {
  return role === 'owner' || role === 'admin';
}

function isWriterRole(role?: string) {
  return role === 'owner' || role === 'admin' || role === 'editor';
}

function AuthCheckingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
      <div className="text-center">
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 dark:border-slate-800 dark:border-t-blue-400" />
        <p className="mt-4 text-sm font-semibold">正在验证登录状态...</p>
      </div>
    </div>
  );
}

function Guard({
  children,
  adminOnly = false,
  writerOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
  writerOnly?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthCheckingScreen />;
  }

  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdminRole(user.role)) return <Navigate to="/admin" />;
  if (writerOnly && !isWriterRole(user.role)) return <Navigate to="/admin/editor-apply" />;

  return <>{children}</>;
}

export default function App() {
  useInertialScroll();

  return (
    <AuthProvider>
      <SiteMeta />
      <BrowserRouter>
        <AppToastHost />
        <Suspense fallback={<MooncciLoadingScreen />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/tag/:tag" element={<TagPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/article/:id" element={<ArticlePage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/video/:classCode" element={<VideosPage />} />
            <Route path="/videos/:id" element={<VideoDetailPage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route path="/admin" element={<Guard writerOnly><AdminShell><AdminPage /></AdminShell></Guard>} />
            <Route path="/admin/posts" element={<Guard writerOnly><AdminShell><AdminPostsPage /></AdminShell></Guard>} />
            <Route path="/admin/write" element={<Guard writerOnly><AdminShell><AdminWritePage /></AdminShell></Guard>} />
            <Route path="/admin/media" element={<Guard writerOnly><AdminShell><AdminMediaPage /></AdminShell></Guard>} />
            <Route path="/admin/videos" element={<Guard writerOnly><AdminShell><AdminVideosPage /></AdminShell></Guard>} />
            <Route path="/admin/posts/:id/edit" element={<Guard writerOnly><AdminShell><AdminWritePage /></AdminShell></Guard>} />
            <Route path="/admin/users" element={<Guard adminOnly><AdminShell><AdminUsersPage /></AdminShell></Guard>} />
            <Route path="/admin/comments" element={<Guard adminOnly><AdminShell><AdminCommentsPage /></AdminShell></Guard>} />
            <Route path="/admin/banned-words" element={<Guard adminOnly><AdminShell><AdminBannedWordsPage /></AdminShell></Guard>} />
            <Route path="/admin/editor-apply" element={<Guard><AdminShell><EditorApplyPage /></AdminShell></Guard>} />
            <Route path="/admin/editor-applications" element={<Guard adminOnly><AdminShell><AdminEditorApplicationsPage /></AdminShell></Guard>} />
            <Route path="/admin/home-settings" element={<Guard adminOnly><AdminShell><AdminHomeSettingsPage /></AdminShell></Guard>} />
            <Route path="/admin/announcements" element={<Guard adminOnly><AdminShell><AdminAnnouncementsPage /></AdminShell></Guard>} />
            <Route path="/admin/site-settings" element={<Guard adminOnly><AdminShell><AdminSiteSettingsPage /></AdminShell></Guard>} />
            <Route path="/admin/mail-settings" element={<Guard adminOnly><AdminShell><AdminMailSettingsPage /></AdminShell></Guard>} />
            <Route path="/admin/send-mail" element={<Guard adminOnly><AdminShell><AdminSendMailPage /></AdminShell></Guard>} />
            <Route path="/admin/router-monitor" element={<Guard adminOnly><AdminShell><AdminRouterMonitorPage /></AdminShell></Guard>} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
