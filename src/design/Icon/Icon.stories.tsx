import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon, type IconName } from "./Icon";

const meta: Meta<typeof Icon> = {
  title: "Design/Icon",
  component: Icon,
};
export default meta;

type Story = StoryObj<typeof Icon>;

const allIcons: IconName[] = [
  "github",
  "edit",
  "save",
  "trash",
  "close",
  "plus",
  "check",
  "spinner",
  "external-link",
  "chevron-left",
  "chevron-down",
  "chevron-up",
  "search",
  "info",
  "warning",
  "error",
];

export const AllIcons: Story = {
  render: () => (
    <div className="grid grid-cols-8 gap-6 p-6">
      {allIcons.map((name) => (
        <div key={name} className="flex flex-col items-center gap-1.5">
          <Icon name={name} size="6" />
          <span className="text-xs text-muted text-center">{name}</span>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6 p-6">
      {(["4", "5", "6"] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-1.5">
          <Icon name="edit" size={size} />
          <span className="text-xs text-muted">size {size}</span>
        </div>
      ))}
    </div>
  ),
};

export const Spinner: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-6">
      <Icon name="spinner" size="5" spin />
      <span className="text-sm text-paper-dim">Loading…</span>
    </div>
  ),
};
