import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { notifyHomeSettingsUpdated } from '../lib/homeSettingsEvents';
import { showAppToast } from '../components/AppToast';
import {
  defaultHomeSettings,
  normalizeHomeSettings,
  type HomeSettings,
  type HomeTopic,
} from '../lib/homeContent';

const iconOptions = [
  { value: 'code', label: '代码' },
  { value: 'terminal', label: '终端' },
  { value: 'network', label: '网络' },
  { value: 'database', label: '数据库' },
  { value: 'server', label: '服务器' },
];

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  placeholder?: string;
};

function Field({ label, value, onChange, textarea = false, placeholder = '' }: FieldProps) {
  const className =
    'mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          className={className}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={className}
        />
      )}
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-lg shadow-gray-200/50">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {description && <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}


type LegacySiteSettings = {
  hero?: {
    badge?: string;
    title_before?: string;
    title_highlight?: string;
    title_after?: string;
    subtitle?: string;
    primary_text?: string;
    primary_link?: string;
    secondary_text?: string;
    secondary_link?: string;
  };
  profile?: {
    name?: string;
    title?: string;
    bio?: string;
    email?: string;
    github_url?: string;
  };
};

function nonEmpty(value: unknown) {
  const text = String(value || '').trim();
  return text || undefined;
}

function legacyTitle(hero: LegacySiteSettings['hero']) {
  const title = [hero?.title_before, hero?.title_highlight, hero?.title_after]
    .map((item) => String(item || ''))
    .join('')
    .trim();

  return title || undefined;
}

function mergeLegacySiteSettings(current: HomeSettings, legacy: LegacySiteSettings): HomeSettings {
  const hero = legacy.hero || {};
  const profile = legacy.profile || {};
  const oldTitle = legacyTitle(hero);
  const oldName = nonEmpty(profile.name);
  const oldRole = nonEmpty(profile.title);

  return normalizeHomeSettings({
    ...current,
    hero_eyebrow: nonEmpty(hero.badge) || current.hero_eyebrow,
    hero_title: oldTitle || current.hero_title,
    hero_subtitle: nonEmpty(hero.subtitle) || current.hero_subtitle,
    primary_cta_label: nonEmpty(hero.primary_text) || current.primary_cta_label,
    primary_cta_url: nonEmpty(hero.primary_link) || current.primary_cta_url,
    secondary_cta_label: nonEmpty(hero.secondary_text) || current.secondary_cta_label,
    secondary_cta_url: nonEmpty(hero.secondary_link) || current.secondary_cta_url,
    about_title: oldName ? `关于 ${oldName}` : current.about_title,
    about_intro: [oldName, oldRole].filter(Boolean).join(' · ') || current.about_intro,
    about_description: nonEmpty(profile.bio) || current.about_description,
    about_email: nonEmpty(profile.email) || current.about_email,
    about_github: nonEmpty(profile.github_url) || current.about_github,
  });
}

export default function AdminHomeSettingsPage() {
  const [settings, setSettings] = useState<HomeSettings>(defaultHomeSettings);
  const [chipsText, setChipsText] = useState(defaultHomeSettings.hero_chips.join('\n'));
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [importingLegacy, setImportingLegacy] = useState(false);

  useEffect(() => {
    api('/home-settings')
      .then((data) => {
        const next = normalizeHomeSettings(data);
        setSettings(next);
        setChipsText(next.hero_chips.join('\n'));
      })
      .catch((err) => showAppToast(err.message || '首页设置加载失败'));
  }, []);

  const update = (key: keyof HomeSettings, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const updateTopic = (index: number, key: keyof HomeTopic, value: string) => {
    setSettings((current) => ({
      ...current,
      topics: current.topics.map((topic, topicIndex) =>
        topicIndex === index ? { ...topic, [key]: value } : topic
      ),
    }));
  };

  const addTopic = () => {
    setSettings((current) => ({
      ...current,
      topics: [
        ...current.topics,
        {
          title: '新专栏',
          description: '这里填写专栏说明。',
          icon: 'code',
          to: '/articles',
        },
      ],
    }));
  };

  const removeTopic = (index: number) => {
    setSettings((current) => ({
      ...current,
      topics: current.topics.filter((_topic, topicIndex) => topicIndex !== index),
    }));
  };

  const persistSettings = async (payload: HomeSettings, successMessage: string) => {
    const data = await api('/home-settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    const next = normalizeHomeSettings(data.settings || payload);
    setSettings(next);
    setChipsText(next.hero_chips.join('\n'));
    notifyHomeSettingsUpdated(next);
    showAppToast(`${successMessage} 已通知公开首页自动刷新。`);
  };

  const save = async () => {
    setSaving(true);
    setMessage('');

    const payload = normalizeHomeSettings({
      ...settings,
      hero_chips: chipsText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    });

    try {
      await persistSettings(payload, '首页设置已保存。公开首页刷新后会重新读取 /api/home-settings。');
    } catch (err: any) {
      showAppToast(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const importLegacySiteSettings = async () => {
    setImportingLegacy(true);
    setMessage('');

    try {
      const legacy = await api('/settings/site');
      const current = normalizeHomeSettings({
        ...settings,
        hero_chips: chipsText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
      });
      const next = mergeLegacySiteSettings(current, legacy || {});

      await persistSettings(next, '已导入旧站点设置中的首页 Hero 和个人资料，并保存到新的首页设置。');
    } catch (err: any) {
      showAppToast(err.message || '导入旧首页设置失败');
    } finally {
      setImportingLegacy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-[2rem] border border-white/60 bg-white/85 p-7 shadow-xl shadow-gray-200/50 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">首页设置</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            单独管理首页 Hero、精选文章占位、最近更新说明、技术专栏和关于作者。
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={importLegacySiteSettings}
            disabled={importingLegacy || saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            {importingLegacy ? '导入中...' : '导入旧首页设置'}
          </button>

          <button
            type="button"
            onClick={save}
            disabled={saving || importingLegacy}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? '保存中...' : '保存首页设置'}
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      <Section title="运维与安全检查" description="这些命令只在维护时使用，默认折叠，避免占用首页设置页面空间。">
        <div className="space-y-3 text-sm leading-6">
          <details className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            <summary className="cursor-pointer font-medium">首页首屏显示和重新打包</summary>
            <p className="mt-3">
              修改首页 Hero、最近更新、技术专栏、关于作者、站点标题、备案、Logo 或 favicon 后，如果希望刷新首页第一眼就是新内容，执行：
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-amber-950 px-4 py-3 text-xs leading-5 text-amber-50">{`cd /www/wwwroot/mooncci-source
./scripts/rebuild-site-settings.sh`}</pre>
            <p className="mt-3">
              脚本会拉取最新站点设置、生成 <code className="rounded bg-amber-100 px-1">initialSiteSettings.ts</code>、
              执行 <code className="rounded bg-amber-100 px-1">npm run build</code> 并部署前端静态文件，不需要重启 PM2。
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-amber-950 px-4 py-3 text-xs leading-5 text-amber-50">{`1. GET https://mooncci.site/api/settings/site
2. 写入 src/app/config/initialSiteSettings.ts
3. 执行 npm run build
4. 备份并替换 /www/wwwroot/mooncci.site/index.html
5. 同步 dist/assets 到 /www/wwwroot/mooncci.site/assets`}</pre>
          </details>

          <details className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900">
            <summary className="cursor-pointer font-medium">安全冒烟测试</summary>
            <p className="mt-3">修改接口、登录认证、权限、评论、上传、媒体库或部署配置后，执行下面脚本快速检查核心链路。</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-blue-950 px-4 py-3 text-xs leading-5 text-blue-50">{`cd /www/wwwroot/mooncci-source

SMOKE_BASE_URL="https://mooncci.site" \
SMOKE_EMAIL="你的登录邮箱" \
SMOKE_PASSWORD="你的登录密码" \
SMOKE_POST_ID="7" \
node scripts/smoke-test.mjs`}</pre>
            <p className="mt-3">脚本会检查健康接口、写接口来源保护、登录 Cookie、当前用户身份、站点设置、文章列表、媒体库、管理接口权限、评论列表和退出登录；不会修改业务数据。</p>
          </details>

          <details className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
            <summary className="cursor-pointer font-medium">数据库迁移</summary>
            <p className="mt-3">
              新增字段、索引或表结构时，把 SQL 放到 <code className="rounded bg-emerald-100 px-1">server/database/migrations</code>，再统一执行：
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-emerald-950 px-4 py-3 text-xs leading-5 text-emerald-50">{`cd /www/wwwroot/mooncci-source/server

node scripts/migrate.js --dry-run
node scripts/migrate.js`}</pre>
            <p className="mt-3">执行前先备份数据库；已执行过的 migration 不要再改，下一次结构调整新建按时间命名的 SQL 文件。</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-emerald-950 px-4 py-3 text-xs leading-5 text-emerald-50">{`server/database/migrations/202605210001_add_xxx.sql
server/database/migrations/202605210002_create_xxx_table.sql`}</pre>
          </details>

          <details className="rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-purple-900">
            <summary className="cursor-pointer font-medium">高风险模块定期复查</summary>
            <p className="mt-3">邮件、上传、Markdown、评论和权限接口改动后，或每月例行维护时，执行只读复查脚本：</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-purple-950 px-4 py-3 text-xs leading-5 text-purple-50">{`cd /www/wwwroot/mooncci-source

./scripts/high-risk-review.sh`}</pre>
            <p className="mt-3">脚本只读取代码、检查响应头、扫描异常上传扩展名和常见敏感字符串，不会修改数据库、文章、评论、用户或媒体文件。</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-purple-950 px-4 py-3 text-xs leading-5 text-purple-50">{`1. /api/health 安全响应头和缓存
2. 写接口 X-Requested-With 来源保护
3. 上传类型、magic number、压缩逻辑和异常扩展名
4. Markdown 安全链接和 HTML 渲染点
5. 评论审核、回复、删除、点赞、IP 脱敏
6. 邮件发送、SMTP 设置和发送接口权限
7. 源码敏感字符串扫描，排除真实 .env
8. PM2 进程状态`}</pre>
          </details>

          <details className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
            <summary className="cursor-pointer font-medium">公开文章发布前脱敏检查</summary>
            <p className="mt-3">发布复盘、教程、审计总结或公开文档前，先用这个脚本扫描真实路径、邮箱、IP、Token、密钥痕迹和内部部署细节。</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-rose-950 px-4 py-3 text-xs leading-5 text-rose-50">{`cd /www/wwwroot/mooncci-source

./scripts/public-doc-scan.sh docs/your-article.md`}</pre>
            <p className="mt-3">如果输出为空，说明没有扫到明显敏感信息；如果有输出，先把真实目录、账号、邮箱、IP、端口、进程名和密钥痕迹改成泛化描述。截图里的地址栏、终端路径和账号也要手动检查。</p>
          </details>
        </div>
      </Section>

      <Section title="Hero 首屏" description="控制首页第一屏的定位文案、说明和按钮。">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="英文标签" value={settings.hero_eyebrow} onChange={(value) => update('hero_eyebrow', value)} />
          <Field label="主标题" value={settings.hero_title} onChange={(value) => update('hero_title', value)} />
          <Field label="主副标题" value={settings.hero_subtitle} onChange={(value) => update('hero_subtitle', value)} textarea />
          <Field label="说明文字" value={settings.hero_description} onChange={(value) => update('hero_description', value)} textarea />
          <Field label="主按钮文字" value={settings.primary_cta_label} onChange={(value) => update('primary_cta_label', value)} />
          <Field label="主按钮链接" value={settings.primary_cta_url} onChange={(value) => update('primary_cta_url', value)} />
          <Field label="次按钮文字" value={settings.secondary_cta_label} onChange={(value) => update('secondary_cta_label', value)} />
          <Field label="次按钮链接" value={settings.secondary_cta_url} onChange={(value) => update('secondary_cta_url', value)} />
        </div>
        <div className="mt-4">
          <Field
            label="首屏标签，一行一个"
            value={chipsText}
            onChange={setChipsText}
            textarea
            placeholder={'持续更新中\nWeb / Linux / OpenWrt / 网络\n项目实践'}
          />
        </div>
      </Section>

      <Section title="精选与最近更新" description="没有文章时使用精选占位；最近更新说明显示在文章列表上方。">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="精选徽标" value={settings.featured_badge} onChange={(value) => update('featured_badge', value)} />
          <Field label="精选占位标题" value={settings.featured_fallback_title} onChange={(value) => update('featured_fallback_title', value)} />
          <Field label="精选占位摘要" value={settings.featured_fallback_summary} onChange={(value) => update('featured_fallback_summary', value)} textarea />
          <div className="grid gap-4">
            <Field label="最近更新英文标签" value={settings.latest_eyebrow} onChange={(value) => update('latest_eyebrow', value)} />
            <Field label="最近更新标题" value={settings.latest_title} onChange={(value) => update('latest_title', value)} />
          </div>
          <div className="md:col-span-2">
            <Field label="最近更新说明" value={settings.latest_description} onChange={(value) => update('latest_description', value)} textarea />
          </div>
        </div>
      </Section>

      <Section title="技术专栏" description="首页下方的内容入口，建议保持 4-6 个。">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="专栏英文标签" value={settings.topics_eyebrow} onChange={(value) => update('topics_eyebrow', value)} />
          <Field label="专栏标题" value={settings.topics_title} onChange={(value) => update('topics_title', value)} />
        </div>

        <div className="mt-5 space-y-4">
          {settings.topics.map((topic, index) => (
            <div key={`${topic.title}-${index}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-gray-900">专栏 {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeTopic(index)}
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="标题" value={topic.title} onChange={(value) => updateTopic(index, 'title', value)} />
                <Field label="链接" value={topic.to} onChange={(value) => updateTopic(index, 'to', value)} />
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">图标</span>
                  <select
                    value={topic.icon || 'code'}
                    onChange={(event) => updateTopic(index, 'icon', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    {iconOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Field label="说明" value={topic.description} onChange={(value) => updateTopic(index, 'description', value)} textarea />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addTopic}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          <Plus className="h-4 w-4" />
          添加专栏
        </button>
      </Section>

      <Section title="关于作者" description="控制首页 About 区块和联系方式。">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="英文标签" value={settings.about_eyebrow} onChange={(value) => update('about_eyebrow', value)} />
          <Field label="标题" value={settings.about_title} onChange={(value) => update('about_title', value)} />
          <Field label="简介" value={settings.about_intro} onChange={(value) => update('about_intro', value)} textarea />
          <Field label="详细说明" value={settings.about_description} onChange={(value) => update('about_description', value)} textarea />
          <Field label="邮箱" value={settings.about_email} onChange={(value) => update('about_email', value)} />
          <Field label="GitHub 链接" value={settings.about_github} onChange={(value) => update('about_github', value)} />
        </div>
      </Section>
    </div>
  );
}
