import { useEffect, useState } from 'react';
import { Edit3, Megaphone, Plus, Save, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { showAppToast } from '../components/AppToast';

type Announcement = {
  id: number;
  title: string;
  content: string;
  link_label?: string;
  link_url?: string;
  status: 'draft' | 'published' | 'archived';
  pinned?: number;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
};

type FormState = {
  title: string;
  content: string;
  link_label: string;
  link_url: string;
  status: 'draft' | 'published' | 'archived';
  pinned: boolean;
};

const emptyForm: FormState = {
  title: '',
  content: '',
  link_label: '查看详情',
  link_url: '/articles',
  status: 'draft',
  pinned: false,
};

function statusText(status: Announcement['status']) {
  if (status === 'published') return '已发布';
  if (status === 'archived') return '已归档';
  return '草稿';
}

function statusClass(status: Announcement['status']) {
  if (status === 'published') return 'bg-emerald-50 text-emerald-700';
  if (status === 'archived') return 'bg-gray-100 text-gray-500';
  return 'bg-amber-50 text-amber-700';
}

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    api('/announcements/admin?status=all')
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => showAppToast(err.message || '公告加载失败'));
  };

  useEffect(() => {
    load();
  }, []);

  const update = (key: keyof FormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const edit = (item: Announcement) => {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      content: item.content || '',
      link_label: item.link_label || '',
      link_url: item.link_url || '',
      status: item.status || 'draft',
      pinned: Boolean(item.pinned),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async () => {
    setSaving(true);
    setMessage('');

    try {
      await api(editingId ? `/announcements/admin/${editingId}` : '/announcements/admin', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });

      showAppToast(editingId ? '公告已保存。' : '公告已创建。');
      reset();
      load();
    } catch (err: any) {
      showAppToast(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const archive = async (item: Announcement) => {
    if (!window.confirm(`确定归档公告“${item.title}”？`)) return;

    setMessage('');

    try {
      await api(`/announcements/admin/${item.id}`, { method: 'DELETE' });
      showAppToast('公告已归档。');
      load();
    } catch (err: any) {
      showAppToast(err.message || '归档失败');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-[2rem] border border-white/60 bg-white/85 p-7 shadow-xl shadow-gray-200/50">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">公告管理</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              发布首页 Notice Bar 使用的公告。置顶公告会优先展示在首页。
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <Plus className="h-4 w-4" />
            新建公告
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      <section className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-lg shadow-gray-200/50">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{editingId ? '编辑公告' : '新建公告'}</h2>
            <p className="text-sm text-gray-500">发布后会显示在首页公告条。</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">标题</span>
            <input
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">状态</span>
            <select
              value={form.status}
              onChange={(event) => update('status', event.target.value as FormState['status'])}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="draft">草稿</option>
              <option value="published">发布</option>
              <option value="archived">归档</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-gray-700">内容</span>
            <textarea
              value={form.content}
              onChange={(event) => update('content', event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">链接文字</span>
            <input
              value={form.link_label}
              onChange={(event) => update('link_label', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">链接地址</span>
            <input
              value={form.link_url}
              onChange={(event) => update('link_url', event.target.value)}
              placeholder="/articles"
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(event) => update('pinned', event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            首页置顶
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? '保存中...' : editingId ? '保存公告' : '创建公告'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              取消编辑
            </button>
          )}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-lg shadow-gray-200/50">
        <h2 className="text-xl font-bold text-gray-900">公告列表</h2>
        <div className="mt-5 space-y-3">
          {items.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-8 text-center text-sm text-gray-500">
              暂无公告。
            </div>
          )}

          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                      {statusText(item.status)}
                    </span>
                    {Boolean(item.pinned) && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">置顶</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-gray-600">{item.content}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    更新时间：{item.updated_at?.slice(0, 10) || item.created_at?.slice(0, 10) || '-'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => edit(item)}
                    className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-50"
                  >
                    <Edit3 className="h-4 w-4" />
                    编辑
                  </button>
                  {item.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => archive(item)}
                      className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      归档
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
