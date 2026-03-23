import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "DS/Button",
  component: Button,
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Save",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Cancel",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Reset",
  },
};

export const WithIcon: Story = {
  args: {
    variant: "primary",
    icon: "save",
    children: "Save",
  },
};

export const WithIconRight: Story = {
  args: {
    variant: "secondary",
    iconRight: "chevron-down",
    children: "Options",
  },
};

export const IconOnly: Story = {
  args: {
    variant: "ghost",
    icon: "edit",
    iconOnly: true,
    "aria-label": "Edit",
  },
};

export const Loading: Story = {
  args: {
    variant: "primary",
    loading: true,
    children: "Saving…",
  },
};

export const Disabled: Story = {
  args: {
    variant: "primary",
    disabled: true,
    children: "Disabled",
  },
};

export const Small: Story = {
  args: {
    variant: "secondary",
    size: "sm",
    icon: "plus",
    children: "Add",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm">
          Primary sm
        </Button>
        <Button variant="secondary" size="sm">
          Secondary sm
        </Button>
        <Button variant="ghost" size="sm">
          Ghost sm
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" icon="save">
          Save
        </Button>
        <Button variant="secondary" icon="edit">
          Edit
        </Button>
        <Button variant="ghost" icon="trash">
          Delete
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" icon="save" iconOnly aria-label="Save" />
        <Button variant="secondary" icon="edit" iconOnly aria-label="Edit" />
        <Button variant="ghost" icon="close" iconOnly aria-label="Close" />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Button variant="primary" loading>
          Loading
        </Button>
      </div>
    </div>
  ),
};
