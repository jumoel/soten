import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "./Text";

const meta: Meta<typeof Text> = {
  title: "Design/Text",
  component: Text,
};
export default meta;

type Story = StoryObj<typeof Text>;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-4">
      {(["h1", "h2", "h3", "h4", "body", "body-dim", "meta", "label"] as const).map((variant) => (
        <div key={variant} className="flex items-baseline gap-3">
          <span className="w-20 text-xs text-muted shrink-0">{variant}</span>
          <Text variant={variant}>The quick brown fox jumps over the lazy dog</Text>
        </div>
      ))}
    </div>
  ),
};

export const OverrideElement: Story = {
  render: () => (
    <p className="text-sm text-paper p-4">
      This is a sentence with{" "}
      <Text variant="body" as="span" className="font-medium">
        inline emphasis
      </Text>{" "}
      using body variant rendered as a span.
    </p>
  ),
};
