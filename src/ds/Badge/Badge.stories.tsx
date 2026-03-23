import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "DS/Badge",
  component: Badge,
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-3 p-6">
      <Badge>Default</Badge>
      <Badge variant="accent">Accent</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
    </div>
  ),
};

export const WithCounts: Story = {
  render: () => (
    <div className="flex items-center gap-3 p-6">
      <Badge>12</Badge>
      <Badge variant="accent">New</Badge>
      <Badge variant="warning">3 unsaved</Badge>
      <Badge variant="error">Failed</Badge>
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-paper">meeting-notes.md</span>
        <Badge variant="accent">Draft</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-paper">todo-list.md</span>
        <Badge variant="warning">Unsaved</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-paper">broken-link.md</span>
        <Badge variant="error">Sync error</Badge>
      </div>
    </div>
  ),
};
