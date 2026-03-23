import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "./Spinner";

const meta: Meta<typeof Spinner> = {
  title: "DS/Spinner",
  component: Spinner,
};
export default meta;

type Story = StoryObj<typeof Spinner>;

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="sm" />
        <span className="text-xs text-muted">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" />
        <span className="text-xs text-muted">md</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" />
        <span className="text-xs text-muted">lg</span>
      </div>
    </div>
  ),
};

export const WithCustomLabel: Story = {
  args: {
    size: "md",
    label: "Syncing with GitHub",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    label: "Loading",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    label: "Loading notes",
  },
};
