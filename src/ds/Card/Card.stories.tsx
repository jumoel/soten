import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  title: "DS/Card",
  component: Card,
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <div className="p-6 max-w-sm">
      <Card>
        <p className="text-sm text-paper">A simple card with body content only.</p>
      </Card>
    </div>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <div className="p-6 max-w-sm">
      <Card header={<span className="text-sm font-medium text-paper">Note details</span>}>
        <p className="text-sm text-paper-dim">
          Last modified 2 hours ago. 3 backlinks found in other notes.
        </p>
      </Card>
    </div>
  ),
};

export const WithHeaderAndFooter: Story = {
  render: () => (
    <div className="p-6 max-w-sm">
      <Card
        header={<span className="text-sm font-medium text-paper">meeting-notes.md</span>}
        footer={<span className="text-xs text-muted">Updated 2025-03-10 at 14:32</span>}
      >
        <p className="text-sm text-paper-dim">
          Weekly standup notes with action items and follow-ups.
        </p>
      </Card>
    </div>
  ),
};

export const Interactive: Story = {
  render: () => (
    <div className="p-6 max-w-sm">
      <Card variant="interactive" onClick={() => {}}>
        <p className="text-sm text-paper">Click this card to navigate somewhere.</p>
      </Card>
    </div>
  ),
};

export const CardList: Story = {
  render: () => (
    <div className="flex flex-col gap-2 p-6 max-w-sm">
      <Card variant="interactive" onClick={() => {}}>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-paper">project-ideas.md</span>
          <span className="text-xs text-muted">Modified 1 hour ago</span>
        </div>
      </Card>
      <Card variant="interactive" onClick={() => {}}>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-paper">reading-list.md</span>
          <span className="text-xs text-muted">Modified 3 days ago</span>
        </div>
      </Card>
      <Card variant="interactive" onClick={() => {}}>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-paper">journal-2025-03.md</span>
          <span className="text-xs text-muted">Modified 1 week ago</span>
        </div>
      </Card>
    </div>
  ),
};
