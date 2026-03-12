import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button, Text } from "../ds";
import { Overlay } from "./Overlay";

const meta: Meta<typeof Overlay> = {
  title: "Components/Overlay",
  component: Overlay,
};
export default meta;

type Story = StoryObj<typeof Overlay>;

function Interactive() {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-6">
      <Button variant="primary" onClick={() => setOpen(true)}>
        Open Overlay
      </Button>
      <Overlay open={open} onClose={() => setOpen(false)} title="References">
        <div className="p-4 flex flex-col gap-3">
          <Text>This is the overlay content.</Text>
          <Text variant="body-dim" className="text-sm">
            Swipe right or tap the backdrop to dismiss.
          </Text>
        </div>
      </Overlay>
    </div>
  );
}

export const Default: Story = {
  render: () => <Interactive />,
};

export const OpenWithContent: Story = {
  render: () => (
    <Overlay open={true} onClose={() => {}} title="References">
      <div className="p-4 flex flex-col gap-3">
        <Text>Reference panel content goes here.</Text>
        <Text variant="body-dim" className="text-sm">
          Search results and pinned reference cards.
        </Text>
      </div>
    </Overlay>
  ),
};
