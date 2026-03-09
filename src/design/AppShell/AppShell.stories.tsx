import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";

const meta: Meta<typeof AppShell> = {
  title: "Design/AppShell",
  component: AppShell,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof AppShell>;

const TopBar = () => (
  <header className="h-12 border-b border-edge bg-surface flex items-center px-4 shrink-0">
    <span className="font-medium text-paper">Soten</span>
  </header>
);

const Sidebar = () => (
  <nav className="p-4 flex flex-col gap-2">
    <span className="text-sm text-paper-dim">Notes</span>
    <span className="text-sm text-muted">Getting started.md</span>
    <span className="text-sm text-muted">README.md</span>
  </nav>
);

const Footer = () => (
  <footer className="h-8 border-t border-edge bg-surface flex items-center px-4">
    <span className="text-xs text-muted">Ready</span>
  </footer>
);

export const Basic: Story = {
  render: () => (
    <AppShell topBar={<TopBar />}>
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-paper">Main content</h1>
        <p className="mt-2 text-paper-dim">TopBar + main content only.</p>
      </div>
    </AppShell>
  ),
};

export const WithSidebar: Story = {
  render: () => (
    <AppShell topBar={<TopBar />} sidebar={<Sidebar />}>
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-paper">Main content</h1>
        <p className="mt-2 text-paper-dim">TopBar + sidebar + main content.</p>
      </div>
    </AppShell>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <AppShell topBar={<TopBar />} footer={<Footer />}>
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-paper">Main content</h1>
        <p className="mt-2 text-paper-dim">TopBar + main content + footer.</p>
      </div>
    </AppShell>
  ),
};

export const FullLayout: Story = {
  render: () => (
    <AppShell topBar={<TopBar />} sidebar={<Sidebar />} footer={<Footer />}>
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-paper">All slots</h1>
        <p className="mt-2 text-paper-dim">TopBar, sidebar, main content, and footer.</p>
      </div>
    </AppShell>
  ),
};

export const ScrollingContent: Story = {
  render: () => (
    <AppShell topBar={<TopBar />} sidebar={<Sidebar />}>
      <div className="p-6 flex flex-col gap-4">
        {Array.from({ length: 40 }, (_, i) => (
          <p key={i} className="text-paper-dim text-sm">
            Line {i + 1} — only the main area scrolls; the sidebar stays fixed.
          </p>
        ))}
      </div>
    </AppShell>
  ),
};
