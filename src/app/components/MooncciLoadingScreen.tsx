export function MooncciLoadingScreen() {
  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#f6f8ff] text-slate-900 dark:bg-[#070b18] dark:text-white">
      <div className="relative flex min-h-screen w-full items-center justify-center px-5 py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_82%_28%,rgba(139,92,246,0.20),transparent_34%)] dark:bg-[radial-gradient(circle_at_18%_18%,rgba(14,165,233,0.16),transparent_28%),radial-gradient(circle_at_82%_28%,rgba(124,58,237,0.24),transparent_34%)]" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-r from-sky-100/80 via-indigo-100/70 to-violet-100/80 blur-sm dark:from-blue-950/40 dark:via-indigo-950/50 dark:to-violet-950/60" />

        <div className="relative w-full max-w-[430px] overflow-hidden rounded-[34px] border border-white/70 bg-white/85 px-8 py-14 text-center shadow-[0_24px_90px_rgba(59,130,246,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_24px_90px_rgba(0,0,0,0.36)]">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-r from-sky-200/50 via-indigo-200/40 to-violet-200/50 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-violet-500/10" />
          <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-500/20" />
          <div className="pointer-events-none absolute -left-20 -bottom-24 h-52 w-52 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/20" />

          <div className="relative z-10">
            <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-[30px] bg-gradient-to-br from-sky-400 via-blue-500 to-violet-500 shadow-[0_18px_55px_rgba(79,70,229,0.30)] dark:shadow-[0_18px_65px_rgba(37,99,235,0.30)]">
                <span className="select-none text-6xl font-black tracking-tight text-white">M</span>
              </div>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Mooncci Admin
            </h1>

            <p className="mt-4 text-sm tracking-[0.34em] text-slate-500 dark:text-slate-300">
              管理更轻松 · 内容更出色
            </p>

            <div className="mx-auto mt-9 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500 dark:border-white/20 dark:border-t-sky-400" />

            <p className="mt-5 text-sm text-slate-400 dark:text-slate-400">
              正在恢复登录状态
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
