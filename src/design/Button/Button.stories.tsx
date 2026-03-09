import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Design/Button",
  component: Button,
};
export default meta;

type Story = StoryObj<typeof Button>;

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-3 p-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      {(["primary", "secondary", "ghost"] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-3">
          <span className="w-20 text-xs text-muted">{variant}</span>
          <Button variant={variant} size="md">
            Medium
          </Button>
          <Button variant={variant} size="sm">
            Small
          </Button>
        </div>
      ))}
    </div>
  ),
};

export const WithLeadingIcon: Story = {
  render: () => (
    <div className="flex gap-3 p-4">
      <Button variant="primary" icon="plus">
        New note
      </Button>
      <Button variant="secondary" icon="save">
        Save
      </Button>
      <Button variant="ghost" icon="edit">
        Edit
      </Button>
    </div>
  ),
};

export const WithTrailingIcon: Story = {
  render: () => (
    <div className="flex gap-3 p-4">
      <Button variant="secondary" iconRight="external-link">
        View on GitHub
      </Button>
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div className="flex gap-2 p-4">
      <Button variant="ghost" icon="edit" iconOnly aria-label="Edit" />
      <Button variant="ghost" icon="trash" iconOnly aria-label="Delete" />
      <Button variant="ghost" icon="close" iconOnly aria-label="Close" />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex gap-3 p-4">
      <Button variant="primary" loading>
        Saving…
      </Button>
      <Button variant="secondary" loading>
        Loading…
      </Button>
    </div>
  ),
};

export const LoadingIconOnly: Story = {
  render: () => (
    <div className="flex gap-2 p-4">
      <Button variant="ghost" iconOnly loading aria-label="Saving" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex gap-3 p-4">
      <Button variant="primary" disabled>
        Primary
      </Button>
      <Button variant="secondary" disabled>
        Secondary
      </Button>
      <Button variant="ghost" disabled>
        Ghost
      </Button>
    </div>
  ),
};

export const KeyboardFocus: Story = {
  render: () => (
    <div className="flex gap-3 p-4">
      <p className="text-sm text-paper-dim mb-2">
        Tab to the buttons below to see focus-visible outlines:
      </p>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};
