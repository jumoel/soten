import type { Meta, StoryObj } from "@storybook/react-vite";
import { FAB } from "./FAB";

const meta: Meta<typeof FAB> = {
  title: "Components/FAB",
  component: FAB,
};
export default meta;

type Story = StoryObj<typeof FAB>;

export const Default: Story = {
  render: () => (
    <div className="relative h-64 w-full bg-base">
      <FAB onClick={() => {}} />
    </div>
  ),
};
