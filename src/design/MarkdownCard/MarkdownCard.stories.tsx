import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { MarkdownCard } from "./MarkdownCard";
import { Button } from "../Button/Button";

const meta: Meta<typeof MarkdownCard> = {
  title: "Design/MarkdownCard",
  component: MarkdownCard,
};
export default meta;

type Story = StoryObj<typeof MarkdownCard>;

const shortHtml = `<p>A short note with just a couple of lines of content. Nothing to expand here.</p>`;

const longHtml = `
<h1>Meeting Notes</h1>
<p>This meeting covered several important topics related to the upcoming product launch.</p>
<h2>Agenda</h2>
<ul>
  <li>Review Q3 roadmap progress</li>
  <li>Discuss design system rollout</li>
  <li>Align on launch timeline</li>
  <li>Open questions and blockers</li>
</ul>
<h2>Key Decisions</h2>
<p>The team agreed to prioritize the design system work before the launch. This will ensure consistency across all surfaces and reduce engineering debt going forward.</p>
<p>The launch date was moved to the end of the quarter to allow adequate time for QA and user testing.</p>
<h2>Action Items</h2>
<ul>
  <li>Alice: finalize component library by Friday</li>
  <li>Bob: schedule user testing sessions</li>
  <li>Carol: update the roadmap document</li>
</ul>
<p>Next meeting is scheduled for next Thursday at 2pm.</p>
`;

export const ShortContent: Story = {
  render: () => (
    <div className="p-4 max-w-lg">
      <MarkdownCard html={shortHtml} collapsed={true} />
    </div>
  ),
};

export const LongCollapsed: Story = {
  render: () => (
    <div className="p-4 max-w-lg">
      <MarkdownCard html={longHtml} collapsed={true} onToggle={() => {}} />
    </div>
  ),
};

export const LongExpanded: Story = {
  render: () => (
    <div className="p-4 max-w-lg">
      <MarkdownCard html={longHtml} collapsed={false} onToggle={() => {}} />
    </div>
  ),
};

export const Uncontrolled: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(true);
    return (
      <div className="p-4 max-w-lg">
        <MarkdownCard
          html={longHtml}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </div>
    );
  },
};

export const WithTimestamp: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(true);
    return (
      <div className="p-4 max-w-lg">
        <MarkdownCard
          html={longHtml}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          timestamp="Mon 9 Mar 2026 · 14:32"
        />
      </div>
    );
  },
};

export const WithActions: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(true);
    return (
      <div className="p-4 max-w-lg">
        <MarkdownCard
          html={longHtml}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          timestamp="Mon 9 Mar 2026 · 14:32"
          actions={
            <>
              <Button variant="ghost" size="sm" aria-label="Edit note">
                Edit
              </Button>
              <Button variant="ghost" size="sm" aria-label="Delete note">
                Delete
              </Button>
            </>
          }
        />
      </div>
    );
  },
};

export const FullWidth: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(true);
    return (
      <div className="p-4 flex gap-3">
        <MarkdownCard
          html={longHtml}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          timestamp="Mon 9 Mar 2026 · 14:32"
          fullWidth
        />
      </div>
    );
  },
};

export const NoToggle: Story = {
  render: () => (
    <div className="p-4 max-w-lg">
      <MarkdownCard html={longHtml} collapsed={false} timestamp="Mon 9 Mar 2026 · 14:32" />
    </div>
  ),
};
