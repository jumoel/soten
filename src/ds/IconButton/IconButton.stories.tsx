import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "./IconButton";

const meta: Meta<typeof IconButton> = {
  title: "DS/IconButton",
  component: IconButton,
};
export default meta;

type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  args: {
    icon: "edit",
    "aria-label": "Edit",
  },
};

export const Small: Story = {
  args: {
    icon: "close",
    "aria-label": "Close",
    size: "sm",
  },
};

export const Loading: Story = {
  args: {
    icon: "save",
    "aria-label": "Save",
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    icon: "trash",
    "aria-label": "Delete",
    disabled: true,
  },
};

export const AllIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3 p-6">
      <IconButton icon="edit" aria-label="Edit" />
      <IconButton icon="save" aria-label="Save" />
      <IconButton icon="trash" aria-label="Delete" />
      <IconButton icon="close" aria-label="Close" />
      <IconButton icon="plus" aria-label="Add" />
      <IconButton icon="search" aria-label="Search" />
      <IconButton icon="info" aria-label="Info" />
      <IconButton icon="chevron-left" aria-label="Back" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3 p-6">
      <IconButton icon="edit" aria-label="Edit" size="md" />
      <IconButton icon="edit" aria-label="Edit" size="sm" />
    </div>
  ),
};
