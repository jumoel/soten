import type { Meta, StoryObj } from "@storybook/react-vite";
import { Link } from "./Link";

const meta: Meta<typeof Link> = {
  title: "DS/Link",
  component: Link,
};
export default meta;

type Story = StoryObj<typeof Link>;

export const Default: Story = {
  args: {
    href: "#",
    children: "Default link",
  },
};

export const Muted: Story = {
  args: {
    href: "#",
    variant: "muted",
    children: "Muted link",
  },
};

export const Nav: Story = {
  args: {
    href: "#",
    variant: "nav",
    children: "Navigation link",
  },
};

export const External: Story = {
  args: {
    href: "https://example.com",
    children: "External link",
  },
};

export const AsButton: Story = {
  args: {
    children: "Button-style link",
    onClick: () => alert("Clicked"),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-6">
      <Link href="#">Default link</Link>
      <Link href="#" variant="muted">
        Muted link
      </Link>
      <Link href="#" variant="nav">
        Navigation link
      </Link>
      <Link href="https://example.com">External link</Link>
      <Link onClick={() => alert("Clicked")}>Button link (no href)</Link>
    </div>
  ),
};
