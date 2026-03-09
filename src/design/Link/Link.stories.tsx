import type { Meta, StoryObj } from "@storybook/react-vite";
import { Link } from "./Link";

const meta: Meta<typeof Link> = {
  title: "Design/Link",
  component: Link,
};
export default meta;

type Story = StoryObj<typeof Link>;

export const Internal: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-6">
      {(["default", "muted", "nav"] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-3">
          <span className="w-16 text-xs text-muted">{variant}</span>
          <Link href="/notes" variant={variant}>
            Go to notes
          </Link>
        </div>
      ))}
    </div>
  ),
};

export const External: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-6">
      <Link href="https://github.com">View on GitHub</Link>
      <Link href="https://github.com" variant="muted">
        Muted external link
      </Link>
    </div>
  ),
};

export const AutoDetection: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-6">
      <div className="flex items-center gap-3">
        <span className="w-36 text-xs text-muted">/notes (internal)</span>
        <Link href="/notes">Notes</Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-36 text-xs text-muted">https://… (external)</span>
        <Link href="https://github.com">GitHub</Link>
      </div>
    </div>
  ),
};
