import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminPage from './pages/AdminPage';
import AdminPostsPage from './pages/AdminPostsPage';
import AdminWritePage from './pages/AdminWritePage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminCommentsPage from './pages/AdminCommentsPage';
import AdminBannedWordsPage from './pages/AdminBannedWordsPage';
import EditorApplyPage from './pages/EditorApplyPage';
import AdminEditorApplicationsPage from './pages/AdminEditorApplicationsPage';
import AdminSiteSettingsPage from './pages/AdminSiteSettingsPage';
import AdminMailSettingsPage from './pages/AdminMailSettingsPage';
import AdminSendMailPage from './pages/AdminSendMailPage';
import AdminMediaPage from './pages/AdminMediaPage';
import AdminVideosPage from './pages/AdminVideosPage';
import AdminRouterMonitorPage from './pages/AdminRouterMonitorPage';
import AdminHomeSettingsPage from './pages/AdminHomeSettingsPage';
import AdminAnnouncementsPage from './pages/AdminAnnouncementsPage';
import HomePage from './pages/HomePage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ArticlePage from './pages/ArticlePage';
import ArticlesPage from './pages/ArticlesPage';
import TagPage from './pages/TagPage';
import TagsPage from './pages/TagsPage';
import CategoryPage from './pages/CategoryPage';
import CategoriesPage from './pages/CategoriesPage';
import SearchPage from './pages/SearchPage';
import VideosPage from './pages/VideosPage';
import VideoDetailPage from './pages/VideoDetailPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminShell } from './components/admin/AdminShell';
import { SiteMeta } from './components/SiteMeta';
import { MooncciLoadingScreen } from './components/MooncciLoadingScreen';
import { useInertialScroll } from './lib/useInertialScroll';

function isAdminRole(role?: string) {
  return role === 'owner' || role === 'admin';
}

function isWriterRole(role?: string) {
  return role === 'owner' || role === 'admin' || role === 'editor';
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
    return <MooncciLoadingScreen />;
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
      </BrowserRouter>
    </AuthProvider>
  );
}
