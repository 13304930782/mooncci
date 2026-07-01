import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, BarChart3, PlayCircle, Users } from 'lucide-react';
import { Header } from '../components/Header';
import { SiteFooter } from '../components/SiteFooter';
import { showAppToast } from '../components/AppToast';
import { api } from '../lib/api';
import { getVideoClassLabel, isVideoClassCode, videoClassOptions } from '../lib/videoClasses';
import { getVideoTrainingSessionLabel, isVideoTrainingSessionCode, videoTrainingSessionOptions } from '../lib/videoTrainingSessions';

type VideoItem = {
  id: number;
  title: string;
  summary?: string;
  team_name?: string;
  class_code?: string;
  class_label?: string;
  training_session?: string;
  training_session_label?: string;
  speaker_names?: string;
  source_type?: 'local' | 'direct' | 'embed';
  source_label?: string;
  embed_url?: string | null;
  provider?: string | null;
  cover_image?: string;
  score_count: number;
  avg_total_score?: number | null;
};

const classColors = [
  'from-blue-600 to-indigo-600',
  'from-violet-600 to-fuchsia-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
];

function formatScore(value?: number | null) {
  if (value == null) return '暂无';
  return `${Number(value).toFixed(1)} / 50`;
}

function sourceProviderMatches(video: VideoItem, providerName: string) {
  return String(video.provider || '').toLowerCase().includes(providerName)
    || String(video.embed_url || '').toLowerCase().includes(providerName);
}

function getSourceLabel(video: VideoItem) {
  if (video.source_label) return video.source_label;
  if (video.source_type === 'embed') {
    if (sourceProviderMatches(video, 'youtube')) return 'YouTube 嵌入';
    if (sourceProviderMatches(video, 'bilibili')) return 'B站嵌入';
    return '第三方嵌入';
  }
  if (video.source_type === 'direct') return '外部直链';
  return '本地上传';
}

function getGroupNumber(teamName?: string) {
  return String(teamName || '').match(/\d+/)?.[0] || '';
}

function getDisplayTeamName(teamName?: string) {
  const groupNumber = getGroupNumber(teamName);
  if (groupNumber) return `第${groupNumber}组`;
  return teamName || '';
}

function getVideoDisplayTitle(video: VideoItem) {
  const groupNumber = getGroupNumber(video.team_name);
  if (groupNumber) return `第${groupNumber}组答辩视频`;
  if (video.team_name) return `${video.team_name}答辩视频`;
  return video.title;
}

function sortVideosByGroup(videos: VideoItem[]) {
  return [...videos].sort((a, b) => {
    const aGroup = Number(getGroupNumber(a.team_name) || Number.MAX_SAFE_INTEGER);
    const bGroup = Number(getGroupNumber(b.team_name) || Number.MAX_SAFE_INTEGER);
    if (aGroup !== bGroup) return aGroup - bGroup;
    return Number(a.id) - Number(b.id);
  });
}

export default function VideosPage() {
  const { classCode: routeClassCode } = useParams();
  const [searchParams] = useSearchParams();
  const requestedClassCode = routeClassCode || searchParams.get('class') || searchParams.get('class_code') || '';
  const requestedTrainingSession = searchParams.get('training') || searchParams.get('training_session') || '';
  const selectedClassCode = isVideoClassCode(requestedClassCode) ? requestedClassCode : '';
  const selectedClassLabel = getVideoClassLabel(selectedClassCode);
  const selectedTrainingSession = isVideoTrainingSessionCode(requestedTrainingSession) ? requestedTrainingSession : '';
  const selectedTrainingSessionLabel = getVideoTrainingSessionLabel(selectedTrainingSession);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedClassCode || !selectedTrainingSession) {
      setVideos([]);
      setLoading(false);
      return;
    }

    const query = `?class_code=${encodeURIComponent(selectedClassCode)}&training_session=${encodeURIComponent(selectedTrainingSession)}`;
    setLoading(true);
    api(`/videos${query}`)
      .then((rows) => setVideos(Array.isArray(rows) ? sortVideosByGroup(rows) : []))
      .catch((err) => showAppToast(err.message || '视频加载失败'))
      .finally(() => setLoading(false));
  }, [selectedClassCode, selectedTrainingSession]);

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
              先选择班级，再选择综训分类。每个入口只展示本班、本综训的视频，评分和导出数据彼此隔离。
            </p>
          </div>
        </section>

        {selectedClassCode && (
          <section className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/40 dark:bg-blue-950/30 sm:flex-row sm:items-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">
                Class Video Page
              </div>
              <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                {selectedClassLabel}{selectedTrainingSessionLabel ? ` / ${selectedTrainingSessionLabel}` : ''} 视频评审
              </h2>
            </div>
            <Link to="/videos" className="inline-flex w-fit rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950">
              返回班级入口
            </Link>
          </section>
        )}

        {!selectedClassCode && (
          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {videoClassOptions.map((item, index) => (
              <Link
                key={item.code}
                to={`/video/${item.code}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/85 p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/85"
              >
                <div className={`absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br ${classColors[index % classColors.length]} opacity-10 transition group-hover:opacity-20`} />
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Class Entry</div>
                <div className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{item.label}</div>
                <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  进入本班综训入口
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </section>
        )}

        {selectedClassCode && (
          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            {videoTrainingSessionOptions.map((item) => {
              const active = selectedTrainingSession === item.code;
              return (
                <Link
                  key={item.code}
                  to={`/video/${selectedClassCode}?training=${item.code}`}
                  className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 ${
                    active
                      ? 'border-blue-500 bg-blue-600 text-white shadow-blue-600/20'
                      : 'border-slate-200/70 bg-white/85 text-slate-950 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900/85 dark:text-white'
                  }`}
                >
                  <div className={`text-xs font-bold uppercase tracking-[0.12em] ${active ? 'text-white/70' : 'text-slate-400'}`}>
                    Training Review
                  </div>
                  <div className="mt-2 text-2xl font-black">{item.label}</div>
                  <div className={`mt-2 text-sm ${active ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                    查看并评分本班 {item.label} 视频
                  </div>
                </Link>
              );
            })}
          </section>
        )}

        {!selectedClassCode && (
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm font-semibold text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
            请选择上方班级入口，进入后再选择综训分类。
          </div>
        )}

        {selectedClassCode && !selectedTrainingSession && (
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm font-semibold text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
            请选择综训1或综训2，选择后只显示对应综训的视频。
          </div>
        )}

        {selectedClassCode && selectedTrainingSession && loading && (
          <div className="mt-6 rounded-xl border border-slate-200/70 bg-white/75 p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900/75">
            正在加载视频...
          </div>
        )}

        {selectedClassCode && selectedTrainingSession && !loading && videos.length === 0 && (
          <div className="mt-6 rounded-xl border border-slate-200/70 bg-white/75 p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900/75">
            当前入口还没有发布答辩视频。
          </div>
        )}

        {selectedClassCode && selectedTrainingSession && videos.length > 0 && (
          <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((video) => (
              <Link
                key={video.id}
                to={`/videos/${video.id}?class=${selectedClassCode}&training=${selectedTrainingSession}`}
                className="group overflow-hidden rounded-xl border border-slate-200/70 bg-white/85 shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/85"
              >
                <div className="relative aspect-video bg-slate-900">
                  {video.cover_image ? (
                    <img src={video.cover_image} alt={getVideoDisplayTitle(video)} className="h-full w-full object-cover" />
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
                    {getDisplayTeamName(video.team_name) && <span>{getDisplayTeamName(video.team_name)}</span>}
                    <span>{video.class_label || getVideoClassLabel(video.class_code)}</span>
                    <span>{video.training_session_label || getVideoTrainingSessionLabel(video.training_session)}</span>
                    {video.speaker_names && <span>主讲：{video.speaker_names}</span>}
                    <span>{getSourceLabel(video)}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-black tracking-tight text-slate-950 dark:text-white">
                    {getVideoDisplayTitle(video)}
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
