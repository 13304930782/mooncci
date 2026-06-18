import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  MemoryStick,
  RefreshCw,
  Router,
  Server,
} from 'lucide-react';
import { api } from '../lib/api';

type Metric = {
  id: number;
  device: string;
  conntrack_count: number | null;
  conntrack_max: number | null;
  conntrack_usage: number | null;
  cpu_usage: number | null;
  load_one: number | null;
  load_five: number | null;
  load_fifteen: number | null;
  memory_total_mb: number | null;
  memory_used_mb: number | null;
  memory_free_mb: number | null;
  memory_usage: number | null;
  disk_total_mb: number | null;
  disk_used_mb: number | null;
  disk_free_mb: number | null;
  disk_usage: number | null;
  uptime_seconds: number | null;
  overall_usage: number | null;
  created_at: string;
};

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return `${Number(value).toFixed(1)}%`;
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return Number(value).toLocaleString('zh-CN');
}

function formatMb(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  if (value >= 1024) return `${(value / 1024).toFixed(1)} GB`;
  return `${value} MB`;
}

function formatTime(value?: string) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return value;
  }
}

function formatUptime(seconds: number | null | undefined) {
  if (!seconds) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days} 天 ${hours} 小时`;
  if (hours > 0) return `${hours} 小时 ${minutes} 分钟`;
  return `${minutes} 分钟`;
}

function getLevel(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return { text: '无数据', className: 'bg-gray-100 text-gray-600', bar: 'bg-gray-300' };
  }
  if (value >= 90) return { text: '危险', className: 'bg-red-50 text-red-700', bar: 'bg-red-500' };
  if (value >= 80) return { text: '偏高', className: 'bg-orange-50 text-orange-700', bar: 'bg-orange-500' };
  if (value >= 60) return { text: '注意', className: 'bg-yellow-50 text-yellow-700', bar: 'bg-yellow-500' };
  return { text: '正常', className: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500' };
}

function StatCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: number | null | undefined;
  detail: string;
  icon: typeof Activity;
}) {
  const level = getLevel(value);
  const width = Math.min(100, Math.max(0, Number(value || 0)));

  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg shadow-black/5">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${level.className}`}>
          {level.text}
        </span>
      </div>

      <div className="mt-5 text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-3xl font-black text-gray-950">{formatPercent(value)}</div>
      <div className="mt-2 min-h-[1.5rem] text-sm text-gray-500">{detail}</div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${level.bar}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function TrendChart({ items }: { items: Metric[] }) {
  const points = useMemo(() => {
    const values = items
      .map((item) => item.overall_usage)
      .filter((value): value is number => value !== null && value !== undefined);
    if (!values.length) return '';

    const width = 720;
    const height = 180;
    const step = values.length > 1 ? width / (values.length - 1) : width;

    return values
      .map((value, index) => {
        const x = index * step;
        const y = height - (Math.min(100, Math.max(0, value)) / 100) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [items]);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg shadow-black/5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-950">24 小时整体使用率趋势</h2>
          <p className="mt-1 text-sm text-gray-500">取 CPU、内存、连接跟踪中的最高值，硬盘容量单独展示。</p>
        </div>
        <Activity className="h-5 w-5 text-blue-600" />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-b from-blue-50 to-white p-4">
        {points ? (
          <svg viewBox="0 0 720 180" className="h-56 w-full">
            <line x1="0" y1="36" x2="720" y2="36" stroke="#e5e7eb" strokeDasharray="5 5" />
            <line x1="0" y1="90" x2="720" y2="90" stroke="#e5e7eb" strokeDasharray="5 5" />
            <line x1="0" y1="144" x2="720" y2="144" stroke="#e5e7eb" strokeDasharray="5 5" />
            <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <div className="flex h-56 items-center justify-center text-sm text-gray-500">
            暂无趋势数据，等待路由器上报。
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminRouterMonitorPage() {
  const [devices, setDevices] = useState<Metric[]>([]);
  const [device, setDevice] = useState('main-router');
  const [latest, setLatest] = useState<Metric | null>(null);
  const [history, setHistory] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function load(nextDevice = device) {
    setLoading(true);
    setMessage('');

    try {
      const [deviceRows, latestData, historyRows] = await Promise.all([
        api('/router-monitor/devices'),
        api(`/router-monitor/latest?device=${encodeURIComponent(nextDevice)}`),
        api(`/router-monitor/history?device=${encodeURIComponent(nextDevice)}&hours=24&limit=288`),
      ]);

      setDevices(Array.isArray(deviceRows) ? deviceRows : []);
      setLatest(latestData?.metric || null);
      setHistory(Array.isArray(historyRows) ? historyRows : []);

      if (!latestData?.metric) {
        setMessage('暂无该设备数据，请确认路由器上报脚本已运行。');
      }
    } catch (err: any) {
      setMessage(err.message || '运维监控加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(device);
    const timer = window.setInterval(() => load(device), 60 * 1000);
    return () => window.clearInterval(timer);
  }, [device]);

  const stale = latest?.created_at
    ? Date.now() - new Date(latest.created_at).getTime() > 5 * 60 * 1000
    : true;

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-gradient-to-br from-gray-950 via-slate-900 to-blue-950 p-8 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
          <Router className="h-4 w-4 text-blue-200" />
          Router Monitor
        </div>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">运维监控</h1>
            <p className="mt-3 text-white/70">查看路由器连接跟踪、CPU、内存、硬盘和运行压力。</p>
          </div>

          <button
            type="button"
            onClick={() => load(device)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-gray-950 transition hover:bg-blue-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-semibold">当前设备：{device}</div>
            <div className="mt-1 text-blue-700">
              最新上报：{latest ? formatTime(latest.created_at) : '-'}
              {stale && <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">数据可能已过期</span>}
            </div>
          </div>

          <select
            value={device}
            onChange={(event) => setDevice(event.target.value)}
            className="rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none"
          >
            <option value="main-router">main-router</option>
            {devices.map((item) => (
              <option key={item.device} value={item.device}>
                {item.device}
              </option>
            ))}
          </select>
        </div>
      </section>

      {message && (
        <section className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5 text-sm text-yellow-800">
          {message}
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="运行压力" value={latest?.overall_usage} detail="CPU、内存、连接跟踪中的最高值" icon={Server} />
        <StatCard title="连接跟踪" value={latest?.conntrack_usage} detail={`${formatNumber(latest?.conntrack_count)} / ${formatNumber(latest?.conntrack_max)}`} icon={Database} />
        <StatCard title="CPU" value={latest?.cpu_usage} detail={`Load ${latest?.load_one ?? '-'} / ${latest?.load_five ?? '-'} / ${latest?.load_fifteen ?? '-'}`} icon={Cpu} />
        <StatCard title="内存" value={latest?.memory_usage} detail={`${formatMb(latest?.memory_used_mb)} / ${formatMb(latest?.memory_total_mb)}`} icon={MemoryStick} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_2fr]">
        <StatCard title="硬盘" value={latest?.disk_usage} detail={`${formatMb(latest?.disk_used_mb)} / ${formatMb(latest?.disk_total_mb)}`} icon={HardDrive} />

        <div className="rounded-3xl bg-white p-6 shadow-lg shadow-black/5">
          <h2 className="text-xl font-bold text-gray-950">设备信息</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="text-gray-500">运行时间</div>
              <div className="mt-2 font-semibold text-gray-950">{formatUptime(latest?.uptime_seconds)}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="text-gray-500">内存剩余</div>
              <div className="mt-2 font-semibold text-gray-950">{formatMb(latest?.memory_free_mb)}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="text-gray-500">硬盘剩余</div>
              <div className="mt-2 font-semibold text-gray-950">{formatMb(latest?.disk_free_mb)}</div>
            </div>
          </div>
        </div>
      </section>

      <TrendChart items={history} />
    </div>
  );
}
