import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Design/Button",
  component: Button,
};
export default meta;

type Story = StoryObj<typeof Button>;

const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

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

export const WithIcon: Story = {
  render: () => (
    <div className="flex gap-3 p-4">
      <Button variant="ghost">
        <PlusIcon />
        Add item
      </Button>
      <Button variant="secondary">
        <PlusIcon />
        New note
      </Button>
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

export const DarkMode: Story = {
  decorators: [
    (Story) => {
      document.documentElement.classList.add("dark");
      return <Story />;
    },
  ],
  render: () => (
    <div className="flex gap-3 bg-base p-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};
