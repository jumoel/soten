import type { Meta, StoryObj } from "@storybook/react-vite";
import { BacklinkCard } from "./BacklinkCard";

const meta: Meta<typeof BacklinkCard> = {
  title: "Components/BacklinkCard",
  component: BacklinkCard,
};
export default meta;

type Story = StoryObj<typeof BacklinkCard>;

export const Default: Story = {
  render: () => (
    <div className="p-6 max-w-sm">
      <BacklinkCard
        title="March 10, 2025"
        snippet="Mentioned this note while discussing the new design system tokens."
        onClick={() => {}}
      />
    </div>
  ),
};

export const LongSnippet: Story = {
  render: () => (
    <div className="p-6 max-w-sm">
      <BacklinkCard
        title="Project Ideas"
        snippet="This is a much longer snippet that should be truncated after two lines. It contains references to the current note and provides context about the backlink relationship."
        onClick={() => {}}
      />
    </div>
  ),
};

export const NoSnippet: Story = {
  render: () => (
    <div className="p-6 max-w-sm">
      <BacklinkCard title="Quick Note" snippet="" onClick={() => {}} />
    </div>
  ),
};
