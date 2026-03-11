import type { Meta, StoryObj } from "@storybook/react-vite";
import { Divider } from "./Divider";

const meta: Meta<typeof Divider> = {
  title: "DS/Divider",
  component: Divider,
};
export default meta;

type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-4">
      <div className="text-sm text-paper">Above the divider</div>
      <Divider />
      <div className="text-sm text-paper">Below the divider</div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex items-center gap-3 p-4 h-16">
      <div className="text-sm text-paper">Left</div>
      <Divider orientation="vertical" />
      <div className="text-sm text-paper">Right</div>
    </div>
  ),
};

export const InStack: Story = {
  render: () => (
    <div className="flex flex-col gap-2 p-4">
      <div className="text-sm text-paper">Item 1</div>
      <Divider />
      <div className="text-sm text-paper">Item 2</div>
      <Divider />
      <div className="text-sm text-paper">Item 3</div>
    </div>
  ),
};
