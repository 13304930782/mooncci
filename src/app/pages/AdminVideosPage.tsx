import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Download, ExternalLink, FileVideo, Link2, Plus, RefreshCw, Trash2, Trophy, Upload, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

type SourceType = 'local' | 'direct' | 'embed';

type VideoRow = {
  id: number;
  title: string;
  summary?: string;
  team_name?: string;
  speaker_names?: string;
  source_type?: SourceType;
  source_label?: string;
  video_url?: string | null;
  embed_url?: string | null;
  provider?: string | null;
  cover_image?: string;
  public_scoring_enabled?: number;
  status: 'draft' | 'published';
  sort_order: number;
  score_count: number;
  avg_total_score?: number | null;
  avg_content_score?: number | null;
  avg_delivery_score?: number | null;
  avg_technical_score?: number | null;
  avg_defense_score?: number | null;
  video_size_text?: string;
};

type ScoreRow = {
  id: number;
  username: string;
  content_score: number;
  delivery_score: number;
  technical_score: number;
  defense_score: number;
  total_score: number;
  comment?: string;
  updated_at?: string;
};


type RankingRow = {
  rank: number | null;
  id: number;
  title: string;
  team_name?: string;
  speaker_names?: string;
  status: 'draft' | 'published';
  score_count: number;
  avg_content_score?: number | null;
  avg_delivery_score?: number | null;
  avg_technical_score?: number | null;
  avg_defense_score?: number | null;
  weighted_score?: number | null;
  trimmed_weighted_score?: number | null;
  score_stddev?: number | null;
  participation_bonus?: number | null;
  consistency_bonus?: number | null;
  tie_breaker?: number | null;
  final_score?: number | null;
};

type FormState = {
  id?: number;
  title: string;
  summary: string;
  team_name: string;
  speaker_names: string;
  source_type: SourceType;
  video_url: string;
  embed_url: string;
  provider: string;
  cover_image: string;
  public_scoring_enabled: boolean;
  status: 'draft' | 'published';
  sort_order: number;
};

const emptyForm: FormState = {
  title: '',
  summary: '',
  team_name: '',
  speaker_names: '',
  source_type: 'local',
  video_url: '',
  embed_url: '',
  provider: '',
  cover_image: '',
  public_scoring_enabled: false,
  status: 'draft',
  sort_order: 0,
};

function formatScore(value?: number | null, suffix = ' / 40') {
  if (value == null) return '暂无';
  return `${Number(value).toFixed(1)}${suffix}`;
}


function formatFinalScore(value?: number | null) {
  if (value == null) return '暂无';
  return Number(value).toFixed(3);
}

function getSourceLabel(video: Pick<VideoRow, 'source_type' | 'source_label' | 'provider'>) {
  if (video.source_label) return video.source_label;
  if (video.source_type === 'embed') {
    if (video.provider === 'youtube') return 'YouTube 嵌入';
    if (video.provider === 'bilibili') return 'B站嵌入';
    return '第三方嵌入';
  }
  if (video.source_type === 'direct') return '外部直链';
  return '本地上传';
}

async function uploadVideo(videoId: number, file: File) {
  const formData = new FormData();
  formData.append('video', file);

  const res = await fetch(`/api/videos/${videoId}/file`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || '视频上传失败');
  return data;
}

async function uploadCover(file: File) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('quality', 'medium');

  const res = await fetch('/api/upload/image', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || '封面上传失败');
  return data.url as string;
}

export default function AdminVideosPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [scoreVideo, setScoreVideo] = useState<VideoRow | null>(null);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [rankings, setRankings] = useState<RankingRow[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  const editing = useMemo(() => videos.find((item) => item.id === form.id), [videos, form.id]);
  const manager = user?.role === 'owner' || user?.role === 'admin';

  const loadRankings = () => {
    if (!manager) return;

    setRankingLoading(true);
    api('/videos/admin/rankings')
      .then((rows) => setRankings(Array.isArray(rows) ? rows : []))
      .catch((err) => setMessage(err.message || '评分排名加载失败'))
      .finally(() => setRankingLoading(false));
  };

  const loadVideos = () => {
    api('/videos/admin')
      .then((rows) => setVideos(Array.isArray(rows) ? rows : []))
      .catch((err) => setMessage(err.message || '视频加载失败'));
  };

  useEffect(() => {
    loadVideos();
    loadRankings();
  }, [manager]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 3200);
    return () => window.clearTimeout(timer);
  }, [message]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const startEdit = (video: VideoRow) => {
    setForm({
      id: video.id,
      title: video.title || '',
      summary: video.summary || '',
      team_name: video.team_name || '',
      speaker_names: video.speaker_names || '',
      source_type: video.source_type || 'local',
      video_url: video.video_url || '',
      embed_url: video.embed_url || '',
      provider: video.provider || '',
      cover_image: video.cover_image || '',
      public_scoring_enabled: Boolean(video.public_scoring_enabled),
      status: video.status || 'draft',
      sort_order: Number(video.sort_order || 0),
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
  };

  const saveVideo = async () => {
    try {
      setSaving(true);
      setMessage('');

      const normalizedVideoUrl = form.video_url.trim();
      const normalizedEmbedUrl = form.embed_url.trim();
      const normalizedProvider = form.provider.trim();
      const normalizedCoverImage = form.cover_image.trim();

      const payload = {
        ...form,
        title: form.title.trim(),
        summary: form.summary.trim(),
        team_name: form.team_name.trim(),
        speaker_names: form.speaker_names.trim(),
        source_type: form.source_type,
        sourceType: form.source_type,
        video_url: normalizedVideoUrl,
        videoUrl: normalizedVideoUrl,
        external_url: normalizedVideoUrl,
        externalUrl: normalizedVideoUrl,
        externalVideoUrl: normalizedVideoUrl,
        embed_url: normalizedEmbedUrl,
        embedUrl: normalizedEmbedUrl,
        provider: normalizedProvider,
        cover_image: normalizedCoverImage,
        coverImage: normalizedCoverImage,
        public_scoring_enabled: form.public_scoring_enabled ? 1 : 0,
        publicScoringEnabled: form.public_scoring_enabled,
        sort_order: Number(form.sort_order || 0),
      };

      if (form.id) {
        await api(`/videos/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setMessage('视频信息已保存');
      } else {
        const created = await api('/videos', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setForm((current) => ({ ...current, id: created.id }));
        setMessage(form.source_type === 'local' ? '视频条目已创建，可以上传本地视频文件' : '视频条目已创建');
      }

      loadVideos();
      loadRankings();
    } catch (err: any) {
      setMessage(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleVideoFile = async (videoId: number, file?: File) => {
    if (!file) return;

    try {
      setUploadingId(videoId);
      setMessage('');
      await uploadVideo(videoId, file);
      setMessage('本地视频文件已上传，视频来源已切换为“本地上传”');
      loadVideos();
      loadRankings();
    } catch (err: any) {
      setMessage(err.message || '视频上传失败');
    } finally {
      setUploadingId(null);
    }
  };

  const handleCoverFile = async (file?: File) => {
    if (!file) return;

    try {
      setMessage('');
      const url = await uploadCover(file);
      setForm((current) => ({ ...current, cover_image: url }));
      setMessage('封面已上传，记得保存视频信息');
    } catch (err: any) {
      setMessage(err.message || '封面上传失败');
    }
  };

  const removeVideo = async (video: VideoRow) => {
    if (!window.confirm(`确定删除「${video.title}」吗？本地视频文件和评分都会删除，外部平台原视频不会删除。`)) return;

    try {
      await api(`/videos/${video.id}`, { method: 'DELETE' });
      setMessage('视频已删除');
      if (form.id === video.id) resetForm();
      loadVideos();
      loadRankings();
    } catch (err: any) {
      setMessage(err.message || '删除失败');
    }
  };

  const loadScores = async (video: VideoRow) => {
    try {
      setScoreVideo(video);
      const data = await api(`/videos/admin/${video.id}/scores`);
      setScores(Array.isArray(data.scores) ? data.scores : []);
    } catch (err: any) {
      setMessage(err.message || '评分明细加载失败');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 p-7 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
          <FileVideo className="h-4 w-4" />
          视频答辩评审
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">视频管理与评分统计</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/75">
          支持本地上传、外部 MP4 直链和 B站 / YouTube 等第三方嵌入；评分按“一个视频全班评分→后台统一统计排名”处理，并支持导出表格。
        </p>
      </section>

      {message && (
        <div className="fixed right-6 top-24 z-50 w-[22rem] max-w-[calc(100vw-3rem)] animate-in fade-in slide-in-from-top-2 duration-200">
          <style>{`
            @keyframes admin-video-toast-progress {
              from { transform: scaleX(0); }
              to { transform: scaleX(1); }
            }
          `}</style>
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
            <div className="flex min-h-14 items-center gap-3 py-3 pl-4 pr-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.10)]" />
              <span className="min-w-0 flex-1 text-sm font-bold leading-6 text-blue-700">{message}</span>
              <button
                type="button"
                onClick={() => setMessage('')}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm shadow-slate-950/10 transition hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                aria-label="关闭提示"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="h-1 bg-slate-100">
              <div
                className="h-full origin-left rounded-r-full bg-blue-600"
                style={{ animation: 'admin-video-toast-progress 3200ms linear forwards' }}
              />
            </div>
          </div>
        </div>
      )}

      {manager && (
        <section className="rounded-3xl bg-white/90 p-6 shadow-lg shadow-black/5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                <Trophy className="h-3.5 w-3.5" />
                全班评分总排名
              </div>
              <h2 className="mt-3 text-xl font-black text-gray-900">按每个视频的全班评分统计最佳分数</h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                最终排名分 = 内容 30% + 技术 30% + 表达 20% + 答辩 20%；5 人及以上自动去掉一个最高和一个最低，再加入极小的人数、稳定度和维度拆分权重，避免同分挤在一起。
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={loadRankings}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                {rankingLoading ? '刷新中' : '刷新排名'}
              </button>
              <a
                href="/api/videos/admin/rankings/export"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                导出 Excel 可打开文件
              </a>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs text-gray-500">
                <tr className="border-b">
                  <th className="py-3 pr-4">排名</th>
                  <th className="py-3 pr-4">视频</th>
                  <th className="py-3 pr-4">评分人数</th>
                  <th className="py-3 pr-4">最终排名分</th>
                  <th className="py-3 pr-4">加权均分</th>
                  <th className="py-3 pr-4">去极值均分</th>
                  <th className="py-3 pr-4">技术</th>
                  <th className="py-3 pr-4">内容</th>
                  <th className="py-3 pr-4">表达</th>
                  <th className="py-3 pr-4">答辩</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-black text-amber-600">{row.rank ? `#${row.rank}` : '-'}</td>
                    <td className="min-w-64 py-3 pr-4">
                      <div className="font-bold text-gray-900">{row.title}</div>
                      <div className="mt-1 text-xs text-gray-500">{row.team_name || '未填写分组'} · {row.speaker_names || '未填写主讲人'}</div>
                    </td>
                    <td className="py-3 pr-4">{row.score_count}</td>
                    <td className="py-3 pr-4 font-black text-blue-700">{formatFinalScore(row.final_score)}</td>
                    <td className="py-3 pr-4">{formatFinalScore(row.weighted_score)}</td>
                    <td className="py-3 pr-4">{formatFinalScore(row.trimmed_weighted_score)}</td>
                    <td className="py-3 pr-4">{formatFinalScore(row.avg_technical_score)}</td>
                    <td className="py-3 pr-4">{formatFinalScore(row.avg_content_score)}</td>
                    <td className="py-3 pr-4">{formatFinalScore(row.avg_delivery_score)}</td>
                    <td className="py-3 pr-4">{formatFinalScore(row.avg_defense_score)}</td>
                  </tr>
                ))}
                {rankings.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-gray-500">暂无评分排名，等同学提交评分后这里会自动统计。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <section className="rounded-3xl bg-white/85 p-6 shadow-lg shadow-black/5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900">{form.id ? '编辑视频' : '新增视频'}</h2>
            {form.id && (
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700">
                <Plus className="h-3.5 w-3.5" />
                新建
              </button>
            )}
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">标题</span>
              <input value={form.title} onChange={(event) => update('title', event.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">分组/小组</span>
              <input value={form.team_name} onChange={(event) => update('team_name', event.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500" placeholder="例如：第六组" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">主讲人</span>
              <input value={form.speaker_names} onChange={(event) => update('speaker_names', event.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500" placeholder="多个名字用顿号或逗号分隔" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">简介</span>
              <textarea value={form.summary} onChange={(event) => update('summary', event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
            </label>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <span className="text-sm font-bold text-gray-900">视频来源</span>
              <div className="mt-3 grid gap-2">
                {([
                  ['local', '本地上传', '小视频直接传到本站服务器'],
                  ['direct', '外部 MP4 直链', 'R2 / OSS / CDN 的 mp4 或 webm 链接'],
                  ['embed', '第三方嵌入播放器', 'B站 / YouTube iframe 或分享链接'],
                ] as const).map(([value, label, help]) => (
                  <label key={value} className={`cursor-pointer rounded-xl border px-3 py-2 text-sm ${form.source_type === value ? 'border-blue-500 bg-white text-blue-700' : 'border-transparent bg-white/60 text-gray-600'}`}>
                    <div className="flex items-center gap-2 font-semibold">
                      <input
                        type="radio"
                        checked={form.source_type === value}
                        onChange={() => update('source_type', value)}
                      />
                      {label}
                    </div>
                    <p className="mt-1 pl-6 text-xs text-gray-500">{help}</p>
                  </label>
                ))}
              </div>
            </div>

            {form.source_type === 'local' && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                保存条目后，在右侧列表点击“上传视频”即可上传或替换本地文件。
              </div>
            )}

            {form.source_type === 'direct' && (
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">外部视频直链</span>
                <input
                  value={form.video_url}
                  onChange={(event) => update('video_url', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="https://example.r2.dev/demo.mp4"
                />
                <span className="mt-1 block text-xs text-gray-500">前台会继续使用本站 video 播放器播放这个地址。</span>
              </label>
            )}

            {form.source_type === 'embed' && (
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">嵌入链接 / iframe 代码</span>
                <textarea
                  value={form.embed_url}
                  onChange={(event) => update('embed_url', event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="https://player.bilibili.com/player.html?bvid=... 或 https://www.youtube.com/watch?v=..."
                />
                <span className="mt-1 block text-xs text-gray-500">可以直接粘贴 B站 / YouTube 分享链接或 iframe 代码，后端会尽量转换成可嵌入地址。</span>
              </label>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">状态</span>
                <select value={form.status} onChange={(event) => update('status', event.target.value as FormState['status'])} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500">
                  <option value="draft">草稿</option>
                  <option value="published">发布</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">排序</span>
                <input type="number" value={form.sort_order} onChange={(event) => update('sort_order', Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
              </label>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
              <input
                type="checkbox"
                checked={form.public_scoring_enabled}
                onChange={(event) => update('public_scoring_enabled', event.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-bold text-gray-900">允许免登录评分</span>
                <span className="mt-1 block text-xs leading-5 text-gray-600">
                  开启后，该视频详情页会显示姓名必填的评分表单；同一视频同一姓名只能提交一次。
                </span>
              </span>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">封面地址</span>
              <input value={form.cover_image} onChange={(event) => update('cover_image', event.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500" placeholder="/api/uploads/cover.webp" />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Upload className="h-4 w-4" />
              上传封面
              <input type="file" accept="image/*" className="hidden" onChange={(event) => handleCoverFile(event.target.files?.[0])} />
            </label>

            {editing?.source_type !== 'embed' && editing?.video_url && (
              <video src={editing.video_url} controls preload="metadata" className="aspect-video w-full rounded-2xl bg-black" />
            )}

            {editing?.source_type === 'embed' && editing.embed_url && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                当前为第三方嵌入：{getSourceLabel(editing)}
              </div>
            )}

            <button type="button" onClick={saveVideo} disabled={saving} className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? '保存中...' : form.id ? '保存视频信息' : '创建视频条目'}
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-white/85 p-6 shadow-lg shadow-black/5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">视频列表</h2>
              <p className="mt-1 text-sm text-gray-500">发布后前台可见；大视频优先使用外部直链或第三方嵌入。</p>
            </div>
            <Link to="/videos" className="rounded-2xl bg-gray-950 px-4 py-2 text-sm font-bold text-white">
              查看前台栏目
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {videos.length === 0 && <p className="text-sm text-gray-500">还没有视频，先从左侧创建一个。</p>}

            {videos.map((video) => (
              <div key={video.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{video.title}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${video.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {video.status === 'published' ? '已发布' : '草稿'}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {getSourceLabel(video)}
                      </span>
                      {Number(video.public_scoring_enabled || 0) === 1 && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          免登录评分已开
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {video.team_name || '未填写分组'} · {video.speaker_names || '未填写主讲人'} · {video.video_size_text || (video.source_type === 'embed' ? '第三方播放器' : video.source_type === 'direct' ? '外部直链' : '未上传视频')}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{video.summary || '暂无简介'}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                      <span>综合均分：{formatScore(video.avg_total_score)}</span>
                      <span>评分人数：{video.score_count}</span>
                      <span>内容：{formatScore(video.avg_content_score, ' / 10')}</span>
                      <span>表达：{formatScore(video.avg_delivery_score, ' / 10')}</span>
                      <span>技术：{formatScore(video.avg_technical_score, ' / 10')}</span>
                      <span>答辩：{formatScore(video.avg_defense_score, ' / 10')}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" onClick={() => startEdit(video)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
                      编辑
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      {uploadingId === video.id ? '上传中' : video.source_type === 'local' ? '上传视频' : '上传并切为本地'}
                      <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" className="hidden" onChange={(event) => handleVideoFile(video.id, event.target.files?.[0])} />
                    </label>
                    {video.source_type === 'direct' && video.video_url && (
                      <a href={video.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
                        <ExternalLink className="h-4 w-4" />
                        直链
                      </a>
                    )}
                    {video.source_type === 'embed' && video.embed_url && (
                      <a href={video.embed_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
                        <Link2 className="h-4 w-4" />
                        嵌入
                      </a>
                    )}
                    {manager && (
                      <button type="button" onClick={() => loadScores(video)} className="inline-flex items-center gap-1 rounded-xl border border-blue-200 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50">
                        <BarChart3 className="h-4 w-4" />
                        明细
                      </button>
                    )}
                    <button type="button" onClick={() => removeVideo(video)} className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {scoreVideo && (
        <section className="rounded-3xl bg-white/90 p-6 shadow-lg shadow-black/5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">评分明细：{scoreVideo.title}</h2>
              <p className="mt-1 text-sm text-gray-500">共 {scores.length} 条评分，可用于课堂汇总。</p>
            </div>
            <button type="button" onClick={() => setScoreVideo(null)} className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
              收起
            </button>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs text-gray-500">
                <tr className="border-b">
                  <th className="py-3 pr-4">用户</th>
                  <th className="py-3 pr-4">总分</th>
                  <th className="py-3 pr-4">内容</th>
                  <th className="py-3 pr-4">表达</th>
                  <th className="py-3 pr-4">技术</th>
                  <th className="py-3 pr-4">答辩</th>
                  <th className="py-3 pr-4">点评</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score) => (
                  <tr key={score.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-semibold text-gray-900">{score.username}</td>
                    <td className="py-3 pr-4 font-bold text-blue-700">{score.total_score}</td>
                    <td className="py-3 pr-4">{score.content_score}</td>
                    <td className="py-3 pr-4">{score.delivery_score}</td>
                    <td className="py-3 pr-4">{score.technical_score}</td>
                    <td className="py-3 pr-4">{score.defense_score}</td>
                    <td className="max-w-md py-3 pr-4 text-gray-600">{score.comment || '-'}</td>
                  </tr>
                ))}
                {scores.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-500">暂无评分</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
