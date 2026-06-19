import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, BarChart3, PlayCircle, Users } from 'lucide-react';
import { Header } from '../components/Header';
import { SiteFooter } from '../components/SiteFooter';
import { api } from '../lib/api';
import { getVideoClassLabel, isVideoClassCode, videoClassOptions } from '../lib/videoClasses';

type VideoItem = {
  id: number;
  title: string;
  summary?: string;
  team_name?: string;
  class_code?: string;
  class_label?: string;
  allowed_class_labels?: string[];
  speaker_names?: string;
  source_type?: 'local' | 'direct' | 'embed';
  source_label?: string;
  provider?: string | null;
  cover_image?: string;
  score_count: number;
  avg_total_score?: number | null;
  video_size_text?: string;
};

function formatScore(value?: number | null) {
  if (value == null) return '暂无';
  return `${Number(value).toFixed(1)} / 40`;
}

function getSourceLabel(video: VideoItem) {
  if (video.source_label) return video.source_label;
  if (video.source_type === 'embed') {
    if (video.provider === 'youtube') return 'YouTube 嵌入';
    if (video.provider === 'bilibili') return 'B站嵌入';
    return '第三方嵌入';
  }
  if (video.source_type === 'direct') return '外部直链';
  return '本地上传';
}

export default function VideosPage() {
  const { classCode } = useParams();
  const [searchParams] = useSearchParams();
  const requestedClassCode = classCode || searchParams.get('class') || searchParams.get('class_code') || '';
  const selectedClassCode = isVideoClassCode(requestedClassCode) ? requestedClassCode : '';
  const selectedClassLabel = getVideoClassLabel(selectedClassCode);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!selectedClassCode) {
      setVideos([]);
      setLoading(false);
      setMessage('');
      return;
    }

    const query = selectedClassCode ? `?class_code=${encodeURIComponent(selectedClassCode)}` : '';

    setLoading(true);
    api(`/videos${query}`)
      .then((rows) => setVideos(Array.isArray(rows) ? rows : []))
      .catch((err) => setMessage(err.message || '视频加载失败'))
      .finally(() => setLoading(false));
  }, [selectedClassCode]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_30rem),linear-gradient(135deg,#f8fafc,#eef6ff_48%,#f8fafc)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_30rem),linear-gradient(135deg,#020617,#0f172a_55%,#020617)] dark:text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-10 pt-28 sm:px-6 lg:pt-32">
        <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 md:p-8">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-600 dark:text-blue-300">
              Video Review
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">
              答辩视频点评
            </h1>
            <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300">
              集中观看班级答辩视频，按内容完整度、表达展示、技术实现、答辩表现四个维度评分，并汇总统计结果。
            </p>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {videoClassOptions.map((item) => {
            const active = selectedClassCode === item.code;

            return (
              <Link
                key={item.code}
                to={`/video/${item.code}`}
                className={`rounded-xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                  active
                    ? 'border-blue-500 bg-blue-600 text-white shadow-blue-200'
                    : 'border-slate-200/70 bg-white/85 text-slate-900 dark:border-slate-800 dark:bg-slate-900/85 dark:text-white'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-[0.12em] opacity-70">Class Entry</div>
                <div className="mt-2 text-2xl font-black">{item.label}</div>
                <div className={`mt-3 text-sm ${active ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                  进入本班身份后进行视频评分
                </div>
              </Link>
            );
          })}
        </section>

        {message && (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        )}

        {!selectedClassCode && (
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm font-semibold text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
            请先选择上方班级入口，进入后只显示该班级的视频。
          </div>
        )}

        {selectedClassCode && loading && (
          <div className="mt-6 rounded-xl border border-slate-200/70 bg-white/75 p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900/75">
            正在加载视频...
          </div>
        )}

        {selectedClassCode && !loading && videos.length === 0 && (
          <div className="mt-6 rounded-xl border border-slate-200/70 bg-white/75 p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900/75">
            还没有发布答辩视频。
          </div>
        )}

        {selectedClassCode && (
        <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <Link
              key={video.id}
              to={`/videos/${video.id}${selectedClassCode ? `?class=${selectedClassCode}` : ''}`}
              className="group overflow-hidden rounded-xl border border-slate-200/70 bg-white/85 shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/85"
            >
              <div className="relative aspect-video bg-slate-900">
                {video.cover_image ? (
                  <img src={video.cover_image} alt={video.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950 text-white">
                    <PlayCircle className="h-14 w-14 opacity-80" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/10 opacity-0 transition group-hover:opacity-100">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-950">
                    播放与评分
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {video.team_name && <span>{video.team_name}</span>}
                  {(video.class_label || video.class_code) && <span>{video.class_label || getVideoClassLabel(video.class_code)}</span>}
                  {video.speaker_names && <span>主讲：{video.speaker_names}</span>}
                  <span>{getSourceLabel(video)}</span>
                </div>
                <h2 className="mt-3 text-lg font-black tracking-tight text-slate-950 dark:text-white">
                  {video.title}
                </h2>
                <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {video.summary || '暂无简介'}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-blue-50 px-3 py-2 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                    <div className="flex items-center gap-1 text-xs opacity-80">
                      <BarChart3 className="h-3.5 w-3.5" />
                      均分
                    </div>
                    <div className="mt-1 font-bold">{formatScore(video.avg_total_score)}</div>
                  </div>
                  <div className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-1 text-xs opacity-80">
                      <Users className="h-3.5 w-3.5" />
                      评分人数
                    </div>
                    <div className="mt-1 font-bold">{video.score_count}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
