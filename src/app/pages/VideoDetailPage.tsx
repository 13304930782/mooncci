import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BarChart3, CheckCircle2, LogIn, Star } from 'lucide-react';
import { Header } from '../components/Header';
import { SiteFooter } from '../components/SiteFooter';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { getVideoClassLabel, isVideoClassCode, videoClassOptions } from '../lib/videoClasses';
import { showAppToast } from '../components/AppToast';

type VideoDetail = {
  id: number;
  title: string;
  summary?: string;
  team_name?: string;
  class_code?: string;
  class_label?: string;
  allowed_class_labels?: string[];
  allowed_class_codes?: string[];
  speaker_names?: string;
  source_type?: 'local' | 'direct' | 'embed';
  source_label?: string;
  video_url?: string | null;
  embed_url?: string | null;
  provider?: string | null;
  cover_image?: string;
  public_scoring_enabled?: number;
  score_count: number;
  avg_total_score?: number | null;
  avg_content_score?: number | null;
  avg_delivery_score?: number | null;
  avg_technical_score?: number | null;
  avg_defense_score?: number | null;
};

type ScoreForm = {
  content_score: number;
  delivery_score: number;
  technical_score: number;
  defense_score: number;
  comment: string;
};

const dimensions = [
  { key: 'content_score', label: '内容完整度', help: '结构、重点、材料完整性' },
  { key: 'delivery_score', label: '表达展示', help: '讲解清晰度、节奏和页面展示' },
  { key: 'technical_score', label: '技术实现', help: '方案完成度、功能质量和细节' },
  { key: 'defense_score', label: '答辩表现', help: '回答问题、总结和临场表达' },
] as const;

const emptyScore: ScoreForm = {
  content_score: 8,
  delivery_score: 8,
  technical_score: 8,
  defense_score: 8,
  comment: '',
};

type ScoreKey = Exclude<keyof ScoreForm, 'comment'>;

function formatScore(value?: number | null) {
  if (value == null) return '暂无';
  return Number(value).toFixed(1);
}

function getSourceLabel(video: VideoDetail) {
  if (video.source_label) return video.source_label;
  if (video.source_type === 'embed') {
    if (video.provider === 'youtube') return 'YouTube 嵌入';
    if (video.provider === 'bilibili') return 'B站嵌入';
    return '第三方嵌入';
  }
  if (video.source_type === 'direct') return '外部直链';
  return '本地上传';
}

function VideoPlayer({ video }: { video: VideoDetail }) {
  if (video.source_type === 'embed' && video.embed_url) {
    return (
      <iframe
        src={video.embed_url}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        className="aspect-video w-full bg-black"
      />
    );
  }

  if (video.video_url) {
    return (
      <video
        src={video.video_url}
        poster={video.cover_image || undefined}
        controls
        preload="metadata"
        className="aspect-video w-full bg-black"
      />
    );
  }

  return (
    <div className="flex aspect-video items-center justify-center bg-slate-950 text-sm text-white/70">
      视频地址尚未配置
    </div>
  );
}

export default function VideoDetailPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedClassCode = searchParams.get('class') || searchParams.get('class_code') || '';
  const { user } = useAuth();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [form, setForm] = useState<ScoreForm>(emptyScore);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [scorerName, setScorerName] = useState('');
  const [scorerGroupName, setScorerGroupName] = useState('');
  const selectedClassCode = isVideoClassCode(requestedClassCode) ? requestedClassCode : '';
  const selectedClassLabel = getVideoClassLabel(selectedClassCode);

  const totalScore = useMemo(
    () => form.content_score + form.delivery_score + form.technical_score + form.defense_score,
    [form]
  );

  const loadVideo = () => {
    if (!id) return;

    setLoading(true);
    Promise.all([
      api(`/videos/${id}`),
      user ? api(`/videos/${id}/my-score`).catch(() => null) : Promise.resolve(null),
    ])
      .then(([videoRow, myScore]) => {
        setVideo(videoRow);
        if (myScore) {
          setForm({
            content_score: Number(myScore.content_score || 8),
            delivery_score: Number(myScore.delivery_score || 8),
            technical_score: Number(myScore.technical_score || 8),
            defense_score: Number(myScore.defense_score || 8),
            comment: myScore.comment || '',
          });
        }
      })
      .catch((err) => setMessage(err.message || '视频加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVideo();
  }, [id, user?.id]);

  const updateScore = (key: ScoreKey, value: string) => {
    const next = Math.max(1, Math.min(10, Number(value) || 1));
    setForm((current) => ({ ...current, [key]: next }));
  };

  const submitScore = async () => {
    if (!id || !video) return;

    const publicScoring = Number(video.public_scoring_enabled || 0) === 1;
    const normalizedScorerName = scorerName.trim().replace(/\s+/g, ' ');
    const normalizedScorerGroupName = scorerGroupName.trim().replace(/\s+/g, ' ');

    if (publicScoring && !normalizedScorerName) {
      setMessage('请先填写姓名。');
      return;
    }

    if (publicScoring && !selectedClassCode) {
      setMessage('请先选择你的班级。');
      return;
    }

    if (publicScoring && !normalizedScorerGroupName) {
      setMessage('请先填写你的小组。');
      return;
    }

    if (!publicScoring && !user) return;

    try {
      setSaving(true);
      setMessage('');
      const result = await api(publicScoring ? `/videos/${id}/public-score` : `/videos/${id}/score`, {
        method: 'POST',
        body: JSON.stringify(publicScoring ? {
          ...form,
          scorer_name: normalizedScorerName,
          scorer_class_code: selectedClassCode,
          scorer_group_name: normalizedScorerGroupName,
        } : form),
      });
      setVideo(result.video);
      showAppToast(publicScoring ? '评分已提交，感谢参与。' : '评分已保存，可以继续修改后重新提交。');
    } catch (err: any) {
      setMessage(err.message || '评分保存失败');
    } finally {
      setSaving(false);
    }
  };

  const publicScoringEnabled = Number(video?.public_scoring_enabled || 0) === 1;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_30rem),linear-gradient(135deg,#f8fafc,#eef6ff_48%,#f8fafc)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_30rem),linear-gradient(135deg,#020617,#0f172a_55%,#020617)] dark:text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-10 pt-28 sm:px-6 lg:pt-32">
        <Link to="/videos" className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-300">
          返回视频栏目
        </Link>

        {loading && (
          <div className="mt-6 rounded-xl border border-slate-200/70 bg-white/75 p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900/75">
            正在加载视频...
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
            {message}
          </div>
        )}

        {video && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <section className="min-w-0">
              <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-slate-950 shadow-xl shadow-slate-950/10 dark:border-slate-800">
                <VideoPlayer video={video} />
              </div>

              <div className="mt-6 rounded-xl border border-slate-200/70 bg-white/85 p-6 shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/85">
                <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {video.team_name && <span>{video.team_name}</span>}
                  {video.speaker_names && <span>主讲：{video.speaker_names}</span>}
                  <span>{getSourceLabel(video)}</span>
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  {video.title}
                </h1>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-600 dark:text-slate-300">
                  {video.summary || '暂无简介'}
                </p>
              </div>
            </section>

            <aside className="space-y-5">
              <section className="rounded-xl border border-slate-200/70 bg-white/85 p-5 shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/85">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  实时统计
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-blue-50 p-3 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                    <div className="text-xs opacity-80">综合均分</div>
                    <div className="mt-1 text-2xl font-black">{formatScore(video.avg_total_score)}</div>
                    <div className="mt-1 text-xs opacity-80">满分 40</div>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <div className="text-xs opacity-80">评分人数</div>
                    <div className="mt-1 text-2xl font-black">{video.score_count}</div>
                    <div className="mt-1 text-xs opacity-80">人</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div>内容完整度：{formatScore(video.avg_content_score)} / 10</div>
                  <div>表达展示：{formatScore(video.avg_delivery_score)} / 10</div>
                  <div>技术实现：{formatScore(video.avg_technical_score)} / 10</div>
                  <div>答辩表现：{formatScore(video.avg_defense_score)} / 10</div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200/70 bg-white/85 p-5 shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/85">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <Star className="h-4 w-4 text-blue-600" />
                  我的评分
                </div>

                {!publicScoringEnabled && !user ? (
                  <div className="mt-4 rounded-lg bg-slate-100 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    登录后可以评分和填写点评。
                    <Link to={`/login?redirect=/videos/${id}`} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">
                      <LogIn className="h-4 w-4" />
                      去登录
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {publicScoringEnabled && (
                      <div className="block rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/30">
                        <div className="mb-4 grid gap-3">
                          <label className="block">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">班级（必选）</div>
                            <select
                              value={selectedClassCode}
                              onChange={(event) => {
                                const next = event.target.value;
                                setSearchParams(next ? { class: next } : {});
                              }}
                              className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-blue-900 dark:bg-slate-950"
                            >
                              <option value="">请选择班级</option>
                              {videoClassOptions.map((item) => (
                                <option key={item.code} value={item.code}>{item.label}</option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">小组（必填）</div>
                            <input
                              value={scorerGroupName}
                              onChange={(event) => setScorerGroupName(event.target.value)}
                              maxLength={100}
                              className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-blue-900 dark:bg-slate-950"
                              placeholder="小组1"
                            />
                          </label>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">姓名（必填）</div>
                        <input
                          value={scorerName}
                          onChange={(event) => setScorerName(event.target.value)}
                          maxLength={100}
                          className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-blue-900 dark:bg-slate-950"
                          placeholder="请填写自己的姓名"
                        />
                        <p className="mt-2 text-xs leading-5 text-blue-700 dark:text-blue-200">
                          同一个视频，同一个姓名只能提交一次评分。
                        </p>
                      </div>
                    )}

                    {dimensions.map((item) => (
                      <label key={item.key} className="block">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{item.help}</div>
                          </div>
                          <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-black text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                            {form[item.key]}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={form[item.key]}
                          onChange={(event) => updateScore(item.key, event.target.value)}
                          className="mt-2 w-full"
                        />
                      </label>
                    ))}

                    <div className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      本次总分：<span className="font-black text-blue-700 dark:text-blue-200">{totalScore}</span> / 40
                    </div>

                    <label className="block">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">点评</div>
                      <textarea
                        value={form.comment}
                        onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
                        rows={4}
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                        placeholder="写下亮点、问题或改进建议"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={submitScore}
                      disabled={saving}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {saving ? '提交中...' : '提交评分'}
                    </button>
                  </div>
                )}
              </section>
            </aside>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
