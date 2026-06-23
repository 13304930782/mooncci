import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

type AppToastDetail = {
  message: string;
  type?: 'info' | 'error';
};

type AppToastState = {
  id: number;
  message: string;
  type: 'info' | 'error';
};

const TOAST_EVENT = 'mooncci:toast';
const TOAST_DURATION = 3200;

function inferToastType(message: string): 'info' | 'error' {
  return /(失败|错误|不能为空|请先|请填写|缺少|不一致|不能|无权限|暂不能|不是|请确认)/.test(message) ? 'error' : 'info';
}

export function showAppToast(message: string, type?: 'info' | 'error') {
  const text = String(message || '').trim();
  if (!text || typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent<AppToastDetail>(TOAST_EVENT, { detail: { message: text, type: type || inferToastType(text) } }));
}

export function AppToastHost() {
  const [toast, setToast] = useState<AppToastState | null>(null);
  const [progress, setProgress] = useState(0);
  const nextId = useRef(1);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<AppToastDetail>).detail;
      const message = String(detail?.message || '').trim();
      if (!message) return;

      setProgress(0);
      setToast({ id: nextId.current, message, type: detail?.type || inferToastType(message) });
      nextId.current += 1;
    };

    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  useEffect(() => {
    if (!toast) {
      setProgress(0);
      return;
    }

    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const next = Math.min(100, ((now - startedAt) / TOAST_DURATION) * 100);
      setProgress(next);

      if (next >= 100) {
        setToast(null);
        return;
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [toast]);

  if (!toast) return null;
  const isError = toast.type === 'error';

  return (
    <div className="fixed right-6 top-24 z-[100] w-[22rem] max-w-[calc(100vw-3rem)] animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex min-h-14 items-center gap-3 py-3 pl-4 pr-3">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${isError ? 'bg-red-600 shadow-[0_0_0_4px_rgba(220,38,38,0.10)]' : 'bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.10)]'}`} />
          <span className={`min-w-0 flex-1 text-sm font-bold leading-6 ${isError ? 'text-red-700' : 'text-blue-700'}`}>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm shadow-slate-950/10 transition hover:border-red-100 hover:bg-red-50 hover:text-red-600"
            aria-label="关闭提示"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-1 bg-slate-100">
          <div className={`h-full rounded-r-full ${isError ? 'bg-red-600' : 'bg-blue-600'}`} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
