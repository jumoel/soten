import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spacer } from "./Spacer";

const meta: Meta<typeof Spacer> = {
  title: "DS/Spacer",
  component: Spacer,
};
export default meta;

type Story = StoryObj<typeof Spacer>;

export const HorizontalPush: Story = {
  render: () => (
    <div className="flex items-center gap-2 p-4 border border-edge rounded-md">
      <div className="text-sm text-paper">Left</div>
      <Spacer />
      <div className="text-sm text-paper">Right</div>
    </div>
  ),
};

export const VerticalPush: Story = {
  render: () => (
    <div className="flex flex-col h-48 p-4 border border-edge rounded-md">
      <div className="text-sm text-paper">Top</div>
      <Spacer />
      <div className="text-sm text-paper">Bottom</div>
    </div>
  ),
};

export const MultipleSections: Story = {
  render: () => (
    <div className="flex items-center gap-2 p-4 border border-edge rounded-md">
      <div className="text-sm text-paper">Logo</div>
      <Spacer />
      <div className="text-sm text-paper">Nav</div>
      <Spacer />
      <div className="text-sm text-paper">Actions</div>
    </div>
  ),
};
