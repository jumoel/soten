import { type ReactNode } from "react";

export type AppShellProps = {
  topBar?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AppShell({ topBar, sidebar, footer, children, className }: AppShellProps) {
  return (
    <div
      className={["w-screen h-screen flex flex-col bg-base antialiased", className ?? ""]
        .filter(Boolean)
        .join(" ")}
    >
      {topBar}
      <div className="flex flex-1 min-h-0">
        {sidebar && (
          <aside className="w-64 shrink-0 border-r border-edge bg-surface overflow-y-auto">
            {sidebar}
          </aside>
        )}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      {footer}
    </div>
  );
}
