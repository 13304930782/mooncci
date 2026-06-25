import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BarChart3, CheckCircle2, Star } from 'lucide-react';
import { Header } from '../components/Header';
import { SiteFooter } from '../components/SiteFooter';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { getVideoClassLabel, isVideoClassCode } from '../lib/videoClasses';
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
  presentation_appearance_score: number;
  presentation_language_score: number;
  presentation_timing_score: number;
  principle_analysis_score: number;
  code_analysis_score: number;
  algorithm_design_score: number;
  implementation_score: number;
  logic_quality_score: number;
  ui_design_score: number;
  extra_feature_score: number;
  answer_clarity_score: number;
  knowledge_score: number;
  content_score: number;
  delivery_score: number;
  technical_score: number;
  defense_score: number;
  comment: string;
};

type PublicScoreStatus = {
  exists: boolean;
  message: string;
  score?: (Partial<ScoreForm> & {
    updated_at?: string;
    scorer_ip?: string;
    total_score?: number;
    max_score?: number;
  }) | null;
};

const dimensions = [
  { key: 'presentation_appearance_score', group: '自述', label: '仪表与态度', help: '仪表大方，衣着端庄，严肃认真', max: 1 },
  { key: 'presentation_language_score', group: '自述', label: '语言与条理', help: '语言简洁、条理清晰，抓住报告项目主要工作', max: 2 },
  { key: 'presentation_timing_score', group: '自述', label: '时间掌握', help: '精准掌握自述时间，限制 3 分钟', max: 2 },
  { key: 'principle_analysis_score', group: '项目分析、设计与实现', label: '基本原理说明', help: '能够清晰说明本和分析涉及到的基本原理', max: 5 },
  { key: 'code_analysis_score', group: '项目分析、设计与实现', label: '内核代码分析', help: '能够准确完成内核代码分析', max: 5 },
  { key: 'algorithm_design_score', group: '项目分析、设计与实现', label: '模拟算法设计', help: '完成模拟算法设计', max: 6 },
  { key: 'implementation_score', group: '项目分析、设计与实现', label: '运行与功能完整性', help: '程序运行流畅，功能实现完整', max: 5 },
  { key: 'logic_quality_score', group: '项目分析、设计与实现', label: '算法逻辑', help: '算法逻辑清晰、合理、严谨', max: 5 },
  { key: 'ui_design_score', group: '项目分析、设计与实现', label: '交互与菜单设计', help: '人机交互界面及菜单设计精美', max: 5 },
  { key: 'extra_feature_score', group: '项目分析、设计与实现', label: '扩展功能', help: '在完成任务功能的基础上实现其他功能', max: 4 },
  { key: 'answer_clarity_score', group: '回答问题', label: '回答思路', help: '语言简练、思路清晰，反映敏捷', max: 4 },
  { key: 'knowledge_score', group: '回答问题', label: '专业知识掌握', help: '专业知识熟练掌握，回答流畅正确', max: 6 },
] as const;

const scoreGroups = [
  { title: '自述（5分）', group: '自述' },
  { title: '项目的分析、设计与实现（35分）', group: '项目分析、设计与实现' },
  { title: '回答问题（10分）', group: '回答问题' },
] as const;

const emptyScore: ScoreForm = {
  presentation_appearance_score: 0,
  presentation_language_score: 0,
  presentation_timing_score: 0,
  principle_analysis_score: 0,
  code_analysis_score: 0,
  algorithm_design_score: 0,
  implementation_score: 0,
  logic_quality_score: 0,
  ui_design_score: 0,
  extra_feature_score: 0,
  answer_clarity_score: 0,
  knowledge_score: 0,
  content_score: 0,
  delivery_score: 0,
  technical_score: 0,
  defense_score: 0,
  comment: '',
};

type ScoreKey = typeof dimensions[number]['key'];

function formatScore(value?: number | null) {
  if (value == null) return '暂无';
  return Number(value).toFixed(1);
}

function buildScoreForm(score?: Partial<ScoreForm> | null): ScoreForm {
  const next = { ...emptyScore };

  dimensions.forEach((item) => {
    const value = Number(score?.[item.key] ?? 0);
    next[item.key] = Math.max(0, Math.min(item.max, Number.isInteger(value) ? value : 0));
  });

  next.content_score = Number(score?.content_score || 0);
  next.delivery_score = Number(score?.delivery_score || 0);
  next.technical_score = Number(score?.technical_score || 0);
  next.defense_score = Number(score?.defense_score || 0);
  next.comment = score?.comment || '';

  return next;
}

function formatDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { hour12: false });
}

function sourceProviderMatches(video: VideoDetail, providerName: string) {
  return String(video.provider || '').toLowerCase().includes(providerName)
    || String(video.embed_url || '').toLowerCase().includes(providerName);
}

function getSourceLabel(video: VideoDetail) {
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

function getVideoDisplayTitle(video: VideoDetail) {
  const groupNumber = getGroupNumber(video.team_name);
  if (groupNumber) return `第${groupNumber}组答辩视频`;
  if (video.team_name) return `${video.team_name}答辩视频`;
  return video.title;
}

function VideoPlayer({ video }: { video: VideoDetail }) {
  if (video.source_type === 'embed' && video.embed_url) {
    return (
      <iframe
        src={video.embed_url}
        title={getVideoDisplayTitle(video)}
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedClassCode = searchParams.get('class') || searchParams.get('class_code') || '';
  const { user } = useAuth();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [form, setForm] = useState<ScoreForm>(emptyScore);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [scorerName, setScorerName] = useState('');
  const [scorerGroupNumber, setScorerGroupNumber] = useState('');
  const [identityChecked, setIdentityChecked] = useState(false);
  const [scoreStatus, setScoreStatus] = useState<PublicScoreStatus | null>(null);
  const selectedClassCode = isVideoClassCode(requestedClassCode) ? requestedClassCode : '';
  const selectedClassLabel = getVideoClassLabel(selectedClassCode);

  const totalScore = useMemo(
    () => dimensions.reduce((sum, item) => sum + Number(form[item.key] || 0), 0),
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
          setForm(buildScoreForm(myScore));
        }
      })
      .catch((err) => showAppToast(err.message || '视频加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVideo();
  }, [id, user?.id]);

  const updateScore = (key: ScoreKey, value: string) => {
    const max = dimensions.find((item) => item.key === key)?.max || 10;
    const next = Math.max(0, Math.min(max, Number(value) || 0));
    setForm((current) => ({ ...current, [key]: next }));
  };

  const checkPublicScore = async () => {
    if (!id || !video) return;

    const normalizedScorerName = scorerName.trim().replace(/\s+/g, ' ');
    const normalizedScorerGroupNumber = scorerGroupNumber.trim();
    const normalizedScorerGroupName = normalizedScorerGroupNumber ? `第${normalizedScorerGroupNumber}组` : '';

    if (!selectedClassCode) {
      showAppToast('请先选择你的班级。');
      return;
    }

    if (!normalizedScorerGroupName) {
      showAppToast('请先填写你的组号。');
      return;
    }

    if (!normalizedScorerName) {
      showAppToast('请先填写姓名。');
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      const query = new URLSearchParams({
        scorer_class_code: selectedClassCode,
        scorer_group_name: normalizedScorerGroupName,
        scorer_name: normalizedScorerName,
      });
      const result = await api(`/videos/${id}/public-score-status?${query.toString()}`);
      setIdentityChecked(true);
      setScoreStatus(result);
      setForm(result.score ? buildScoreForm(result.score) : emptyScore);
      showAppToast(result.message || (result.exists ? '已找到历史评分。' : '暂无评分记录。'));
    } catch (err: any) {
      setIdentityChecked(false);
      setScoreStatus(null);
      showAppToast(err.message || '评分记录查询失败');
    } finally {
      setSaving(false);
    }
  };

  const submitScore = async () => {
    if (!id || !video) return;

    const publicScoring = Number(video.public_scoring_enabled || 0) === 1;
    const normalizedScorerName = scorerName.trim().replace(/\s+/g, ' ');
    const normalizedScorerGroupNumber = scorerGroupNumber.trim();
    const normalizedScorerGroupName = normalizedScorerGroupNumber ? `第${normalizedScorerGroupNumber}组` : '';

    if (publicScoring && !normalizedScorerName) {
      showAppToast('请先填写姓名。');
      return;
    }

    if (publicScoring && !selectedClassCode) {
      showAppToast('请先选择你的班级。');
      return;
    }

    if (publicScoring && !normalizedScorerGroupName) {
      showAppToast('请先填写你的组号。');
      return;
    }

    if (publicScoring && !identityChecked) {
      showAppToast('请先点击“确认信息”，查询是否已有评分。');
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
      if (publicScoring && result.score) {
        setScoreStatus({ exists: true, message: '评分已保存，可继续修改后替换。', score: result.score });
      }
      showAppToast(publicScoring ? '评分已保存，感谢参与。' : '评分已保存，可以继续修改后重新提交。');
    } catch (err: any) {
      showAppToast(err.message || '评分保存失败');
    } finally {
      setSaving(false);
    }
  };

  const publicScoringEnabled = Number(video?.public_scoring_enabled || 0) === 1;
  const fallbackListPath = selectedClassCode ? `/videos/${selectedClassCode}` : '/videos';
  const goBackToList = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackListPath);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_30rem),linear-gradient(135deg,#f8fafc,#eef6ff_48%,#f8fafc)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_30rem),linear-gradient(135deg,#020617,#0f172a_55%,#020617)] dark:text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-10 pt-28 sm:px-6 lg:pt-32">
        <button type="button" onClick={goBackToList} className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-300">
          返回视频栏目
        </button>

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
                  {getDisplayTeamName(video.team_name) && <span>{getDisplayTeamName(video.team_name)}</span>}
                  {video.speaker_names && <span>主讲：{video.speaker_names}</span>}
                  <span>{getSourceLabel(video)}</span>
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  {getVideoDisplayTitle(video)}
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
                    <div className="mt-1 text-xs opacity-80">满分 50</div>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <div className="text-xs opacity-80">评分人数</div>
                    <div className="mt-1 text-2xl font-black">{video.score_count}</div>
                    <div className="mt-1 text-xs opacity-80">人</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div>自述：{formatScore(video.avg_content_score)} / 5</div>
                  <div>项目分析、设计与实现：{formatScore(video.avg_technical_score)} / 35</div>
                  <div>回答问题：{formatScore(video.avg_defense_score)} / 10</div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200/70 bg-white/85 p-5 shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/85">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <Star className="h-4 w-4 text-blue-600" />
                  我的评分
                </div>

                {!publicScoringEnabled ? (
                  <div className="mt-4 rounded-lg bg-slate-100 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    当前视频评分暂未开放或已停止，请等待老师开放后再提交评分。
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {publicScoringEnabled && (
                      <div className="block rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/30">
                        <div className="mb-4 grid gap-3">
                          <div className="block">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">班级</div>
                            {selectedClassCode ? (
                              <div className="mt-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-blue-900 dark:bg-slate-950 dark:text-white">
                                {selectedClassLabel}
                              </div>
                            ) : (
                              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                                请先从对应班级入口进入视频，再进行评分。
                                <Link to="/videos" className="mt-2 inline-flex rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white hover:bg-amber-700">
                                  返回选择班级
                                </Link>
                              </div>
                            )}
                          </div>
                          <label className="block">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">组号（必填）</div>
                            <div className="mt-2 flex overflow-hidden rounded-lg border border-blue-200 bg-white focus-within:border-blue-500 dark:border-blue-900 dark:bg-slate-950">
                              <span className="flex items-center border-r border-blue-100 bg-blue-50 px-3 text-sm font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                                第
                              </span>
                              <input
                                value={scorerGroupNumber}
                                onChange={(event) => {
                                  setIdentityChecked(false);
                                  setScoreStatus(null);
                                  setScorerGroupNumber(event.target.value.replace(/\D/g, '').slice(0, 2));
                                }}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                                placeholder="1"
                              />
                              <span className="flex items-center border-l border-blue-100 bg-blue-50 px-3 text-sm font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                                组
                              </span>
                            </div>
                          </label>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">姓名（必填）</div>
                        <input
                          value={scorerName}
                          onChange={(event) => {
                            setIdentityChecked(false);
                            setScoreStatus(null);
                            setScorerName(event.target.value);
                          }}
                          maxLength={100}
                          className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-blue-900 dark:bg-slate-950"
                          placeholder="请填写自己的姓名"
                        />
                        <p className="mt-2 text-xs leading-5 text-blue-700 dark:text-blue-200">
                          先确认信息；如果已有评分，会回填上次评分并允许直接替换。
                        </p>
                        <button
                          type="button"
                          onClick={checkPublicScore}
                          disabled={saving}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
                        >
                          {saving ? '查询中...' : '确认信息'}
                        </button>
                        {scoreStatus && (
                          <div className={`mt-3 rounded-lg px-3 py-2 text-xs leading-5 ${scoreStatus.exists ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200'}`}>
                            <div>{scoreStatus.message}</div>
                            {scoreStatus.exists && scoreStatus.score && (
                              <div className="mt-1">
                                上次提交：{formatDateTime(scoreStatus.score.updated_at) || '未知时间'}；IP：{scoreStatus.score.scorer_ip || '未知'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {publicScoringEnabled && !identityChecked && (
                      <div className="rounded-lg bg-slate-100 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        确认班级、组号和姓名后，下方会显示完整评分表。
                      </div>
                    )}
                  </div>
                )}
              </section>
            </aside>
          </div>
        )}

        {video && publicScoringEnabled && identityChecked && (
          <section className="mt-6 rounded-xl border border-slate-200/70 bg-white/90 p-5 shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Score Sheet</div>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">评审小组评分记录表</h2>
              </div>
              <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                本次总分：<span className="text-xl font-black">{totalScore}</span> / 50
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.7fr_0.9fr]">
              {scoreGroups.map((scoreGroup) => (
                <div key={scoreGroup.group} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <h3 className="text-center text-base font-black text-slate-950 dark:text-white">{scoreGroup.title}</h3>
                  <div className="mt-4 space-y-4">
                    {dimensions.filter((item) => item.group === scoreGroup.group).map((item) => (
                      <label key={item.key} className="block rounded-lg bg-white p-3 shadow-sm shadow-slate-950/5 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-950 dark:text-white">{item.label}</div>
                            <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.help}</div>
                          </div>
                          <span className="shrink-0 rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-black text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                            {form[item.key]} / {item.max}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={item.max}
                          value={form[item.key]}
                          onChange={(event) => updateScore(item.key, event.target.value)}
                          className="mt-3 w-full"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
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
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                {saving ? '提交中...' : scoreStatus?.exists ? '替换评分' : '提交评分'}
              </button>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
