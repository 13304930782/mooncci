import { useEffect, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { api } from '../lib/api';
import { safeImageSrc } from '../lib/safeUrl';
import { showAppToast } from '../components/AppToast';

const defaultBrand = {
  site_title: '',
  nav_title: '',
  logo_url: '',
  favicon_url: '',
};

const defaultProfile = {
  name: '',
  title: '',
  bio: '',
  avatar_url: '',
  github_url: '',
  twitter_url: '',
  email: '',
};


const defaultFooter = {
  copyright: '',
  icp_text: '',
  icp_url: '',
  police_text: '',
  police_url: '',
  police_icon_url: '',
};

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,image/x-icon,image/vnd.microsoft.icon,.jpg,.jpeg,.png,.gif,.webp,.ico';

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch('/api/upload/image', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '图片上传失败');
  }

  return data.url;
}

export default function AdminSiteSettingsPage() {
  const [brand, setBrand] = useState(defaultBrand);
  const [profile, setProfile] = useState(defaultProfile);
  const [footer, setFooter] = useState(defaultFooter);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarUrl = safeImageSrc(profile.avatar_url);

  useEffect(() => {
    api('/settings/site')
      .then((data) => {
        setBrand({ ...defaultBrand, ...(data.brand || {}) });
        setProfile({ ...defaultProfile, ...(data.profile || {}) });
        setFooter({ ...defaultFooter, ...(data.footer || {}) });
      })
      .catch(() => setMessage('站点资料加载失败'));
  }, []);

  const updateBrand = (key: string, value: string) => {
    setBrand((prev) => ({ ...prev, [key]: value }));
  };

  const updateProfile = (key: string, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };


  const updateFooter = (key: string, value: string) => {
    setFooter((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setMessage('');

    try {
      await api('/settings/site', {
        method: 'PUT',
        body: JSON.stringify({ brand, profile, footer }),
      });

      showAppToast('保存成功');
    } catch (err: any) {
      setMessage(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file?: File) => {
    if (!file) return;

    setUploading(true);
    setMessage('');

    try {
      const url = await uploadImage(file);
      updateProfile('avatar_url', url);
      showAppToast('头像上传成功，记得点击保存');
    } catch (err: any) {
      setMessage(err.message || '头像上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleBrandImageUpload = async (key: 'logo_url' | 'favicon_url', file?: File) => {
    if (!file) return;

    setUploading(true);
    setMessage('');

    try {
      const url = await uploadImage(file);
      updateBrand(key, url);
      showAppToast(key === 'logo_url' ? 'Logo 上传成功，记得点击保存' : 'favicon 上传成功，记得点击保存');
    } catch (err: any) {
      setMessage(err.message || '图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="rounded-[2rem] bg-white/85 backdrop-blur border border-white/50 p-8 shadow-xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">站点资料设置</h1>
          <p className="mt-2 text-sm text-gray-500">
            管理浏览器标题、Logo、侧边栏个人资料和底部备案信息；首页内容请到“首页设置”。
          </p>
        </div>


        {message && (
          <div className="mb-5 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {message}
          </div>
        )}

        
        <section className="rounded-3xl border border-gray-200 bg-white/70 p-6">
          <h2 className="text-xl font-semibold text-gray-900">品牌与图标设置</h2>
          <p className="mt-1 text-sm text-gray-500">
            对应浏览器标签页标题、小图标，以及网站左上角 Logo 和标题。
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">浏览器标题</label>
              <input
                value={brand.site_title}
                onChange={(e) => updateBrand('site_title', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="个人博客网站设计"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">导航栏标题</label>
              <input
                value={brand.nav_title}
                onChange={(e) => updateBrand('nav_title', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="计算机博客"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Logo 图片地址</label>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  value={brand.logo_url}
                  onChange={(e) => updateBrand('logo_url', e.target.value)}
                  className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/api/uploads/logo.png 或 https://..."
                />

                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gray-950 px-5 py-3 text-white hover:bg-gray-800">
                  <UploadCloud className="w-4 h-4" />
                  {uploading ? '上传中...' : '上传 Logo'}
                  <input
                    type="file"
                    accept={IMAGE_ACCEPT}
                    className="hidden"
                    onChange={(e) => handleBrandImageUpload('logo_url', e.target.files?.[0])}
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">显示在网站左上角，建议使用正方形图片。</p>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">浏览器小图标 favicon 地址</label>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  value={brand.favicon_url}
                  onChange={(e) => updateBrand('favicon_url', e.target.value)}
                  className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/api/uploads/favicon.png 或 https://..."
                />

                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gray-950 px-5 py-3 text-white hover:bg-gray-800">
                  <UploadCloud className="w-4 h-4" />
                  {uploading ? '上传中...' : '上传 favicon'}
                  <input
                    type="file"
                    accept={IMAGE_ACCEPT}
                    className="hidden"
                    onChange={(e) => handleBrandImageUpload('favicon_url', e.target.files?.[0])}
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">显示在浏览器标签页左侧，建议使用 32×32 或 64×64 图片。</p>
            </div>
          </div>
        </section>


        <section className="mt-6 rounded-3xl border border-gray-200 bg-white/70 p-6">
          <h2 className="text-xl font-semibold text-gray-900">侧边栏个人资料</h2>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="rounded-3xl bg-gray-50 p-6 text-center">
                <div className="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                  <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400">头像</span>
                    )}
                  </div>
                </div>

                <h2 className="mt-4 text-xl font-semibold text-gray-900">{profile.name || '未设置名称'}</h2>
                <p className="mt-1 text-sm text-gray-500">{profile.title || '未设置身份'}</p>
                <p className="mt-4 text-sm leading-7 text-gray-600">{profile.bio || '未设置简介'}</p>

                <label className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gray-950 px-5 py-3 text-white hover:bg-gray-800">
                  <UploadCloud className="w-4 h-4" />
                  {uploading ? '上传中...' : '上传头像'}
                  <input type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
                </label>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-5">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">名称</label>
                <input value={profile.name} onChange={(e) => updateProfile('name', e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">身份标题</label>
                <input value={profile.title} onChange={(e) => updateProfile('title', e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">个人简介</label>
                <textarea value={profile.bio} onChange={(e) => updateProfile('bio', e.target.value)} rows={4} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">头像地址</label>
                <input value={profile.avatar_url} onChange={(e) => updateProfile('avatar_url', e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">GitHub 链接</label>
                  <input value={profile.github_url} onChange={(e) => updateProfile('github_url', e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Twitter / X 链接</label>
                  <input value={profile.twitter_url} onChange={(e) => updateProfile('twitter_url', e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">邮箱</label>
                  <input value={profile.email} onChange={(e) => updateProfile('email', e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white/70 p-6">
          <h2 className="text-xl font-semibold text-gray-900">底部备案设置</h2>
          <p className="mt-1 text-sm text-gray-500">
            这里会替换原来的 Theme by Puock。电脑端横向显示，手机端上下显示。
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700">版权文字</label>
              <input
                value={footer.copyright}
                onChange={(e) => updateFooter('copyright', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Copyright mooncci in LNTU"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">ICP备案文字</label>
              <input
                value={footer.icp_text}
                onChange={(e) => updateFooter('icp_text', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="辽ICP备2024042989号-1"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">ICP备案链接</label>
              <input
                value={footer.icp_url}
                onChange={(e) => updateFooter('icp_url', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://beian.miit.gov.cn/"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">公安备案文字</label>
              <input
                value={footer.police_text}
                onChange={(e) => updateFooter('police_text', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="辽公网安备21041102000430号"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">公安备案链接</label>
              <input
                value={footer.police_url}
                onChange={(e) => updateFooter('police_url', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://beian.mps.gov.cn/#/query/webSearch?code=21041102000430"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700">公安图标链接</label>
              <input
                value={footer.police_icon_url}
                onChange={(e) => updateFooter('police_icon_url', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://moooncci.cn/wp-content/uploads/2025/10/police.icon_-1.png"
              />
            </div>
          </div>
        </section>

        <button
          onClick={save}
          disabled={saving}
          className="mt-8 rounded-2xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? '保存中...' : '保存全部设置'}
        </button>
      </div>
    </div>
  );
}
