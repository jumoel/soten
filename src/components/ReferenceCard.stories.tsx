import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { ReferenceMode } from "../state/ui";
import { ReferenceCard } from "./ReferenceCard";

const meta: Meta<typeof ReferenceCard> = {
  title: "Components/ReferenceCard",
  component: ReferenceCard,
};
export default meta;

type Story = StoryObj<typeof ReferenceCard>;

const sampleContent = `# Sample Note

This is a **sample note** with some markdown content.

- Item one
- Item two
- Item three

## Details

Here is a paragraph with more text to demonstrate the excerpt vs expanded modes.

Another paragraph to add more content for the expanded view. This should be visible
when the card is fully expanded but truncated in excerpt mode.
`;

function Interactive() {
  const [mode, setMode] = useState<ReferenceMode>("excerpt");
  return (
    <div className="p-6 max-w-sm">
      <ReferenceCard
        title="March 10, 2025"
        date="Mar 10, 2025"
        content={sampleContent}
        mode={mode}
        onChangeMode={setMode}
        onDismiss={() => {}}
      />
    </div>
  );
}

export const Collapsed: Story = {
  render: () => (
    <div className="p-6 max-w-sm">
      <ReferenceCard
        title="March 10, 2025"
        date="Mar 10, 2025"
        content={sampleContent}
        mode="collapsed"
        onChangeMode={() => {}}
        onDismiss={() => {}}
      />
    </div>
  ),
};

export const Excerpt: Story = {
  render: () => (
    <div className="p-6 max-w-sm">
      <ReferenceCard
        title="March 10, 2025"
        date="Mar 10, 2025"
        content={sampleContent}
        mode="excerpt"
        onChangeMode={() => {}}
        onDismiss={() => {}}
      />
    </div>
  ),
};

export const Expanded: Story = {
  render: () => (
    <div className="p-6 max-w-sm">
      <ReferenceCard
        title="March 10, 2025"
        date="Mar 10, 2025"
        content={sampleContent}
        mode="expanded"
        onChangeMode={() => {}}
        onDismiss={() => {}}
      />
    </div>
  ),
};

export const InteractiveToggle: Story = {
  render: () => <Interactive />,
};
