import type { ReactNode } from 'react';
import { Header } from '../Header';
import { SiteFooter } from '../SiteFooter';

export const pageBackgroundClass =
  'min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_30rem),linear-gradient(135deg,#f8fafc,#eef6ff_48%,#f8fafc)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_30rem),linear-gradient(135deg,#020617,#0f172a_55%,#020617)] dark:text-white';

type PageShellProps = {
  children: ReactNode;
  mainClassName?: string;
  withFooter?: boolean;
};

export function PageShell({ children, mainClassName = '', withFooter = true }: PageShellProps) {
  return (
    <div className={pageBackgroundClass}>
      <Header />
      <main className={mainClassName}>{children}</main>
      {withFooter ? <SiteFooter /> : null}
    </div>
  );
}
