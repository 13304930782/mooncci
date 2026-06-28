export function MooncciLoadingScreen() {
  return (
    <div className="grid min-h-screen w-full place-items-center bg-[#f6f8ff] px-6 text-slate-900 dark:bg-[#070b18] dark:text-white">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-violet-500 shadow-[0_18px_55px_rgba(79,70,229,0.24)]">
          <span className="select-none text-3xl font-black tracking-tight text-white">M</span>
        </div>

        <div className="mx-auto mt-7 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500 dark:border-white/20 dark:border-t-sky-400" />

        <p className="mt-5 text-sm font-semibold text-slate-500 dark:text-slate-300">
          页面加载中...
        </p>
      </div>
    </div>
  );
}
