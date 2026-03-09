import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../Button/Button";
import { Popover } from "./Popover";

const meta: Meta<typeof Popover> = {
  title: "Design/Popover",
  component: Popover,
};
export default meta;

type Story = StoryObj<typeof Popover>;

function SamplePanel() {
  return (
    <div className="p-2 text-sm text-paper">
      <p className="px-2 py-1">Item one</p>
      <p className="px-2 py-1">Item two</p>
      <p className="px-2 py-1">Item three</p>
    </div>
  );
}

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-8 flex justify-end">
        <Popover
          trigger={
            <Button onClick={() => setOpen((o) => !o)} aria-label="Open popover">
              Open
            </Button>
          }
          open={open}
          onOpenChange={setOpen}
        >
          <SamplePanel />
        </Popover>
      </div>
    );
  },
};

export const AlignStart: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-8">
        <Popover
          trigger={
            <Button onClick={() => setOpen((o) => !o)} aria-label="Open popover">
              Open
            </Button>
          }
          open={open}
          onOpenChange={setOpen}
          align="start"
        >
          <SamplePanel />
        </Popover>
      </div>
    );
  },
};

export const SideTop: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-8 mt-32">
        <Popover
          trigger={
            <Button onClick={() => setOpen((o) => !o)} aria-label="Open popover">
              Open above
            </Button>
          }
          open={open}
          onOpenChange={setOpen}
          side="top"
        >
          <SamplePanel />
        </Popover>
      </div>
    );
  },
};

export const WithActions: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-8 flex justify-end">
        <Popover
          trigger={
            <Button onClick={() => setOpen((o) => !o)} aria-label="Open popover">
              Actions
            </Button>
          }
          open={open}
          onOpenChange={setOpen}
        >
          <div className="p-2 flex flex-col gap-1">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Edit
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </div>
        </Popover>
      </div>
    );
  },
};

export const ControlledToggle: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-8 flex gap-4 items-start justify-end">
        <span className="text-sm text-muted">{open ? "open" : "closed"}</span>
        <Popover
          trigger={
            <Button onClick={() => setOpen((o) => !o)} aria-label="Toggle popover">
              Toggle
            </Button>
          }
          open={open}
          onOpenChange={setOpen}
        >
          <SamplePanel />
        </Popover>
      </div>
    );
  },
};

export const DarkMode: Story = {
  decorators: [
    (Story) => {
      document.documentElement.classList.add("dark");
      return <Story />;
    },
  ],
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="bg-base p-8 flex justify-end">
        <Popover
          trigger={
            <Button onClick={() => setOpen((o) => !o)} aria-label="Open popover">
              Open
            </Button>
          }
          open={open}
          onOpenChange={setOpen}
        >
          <SamplePanel />
        </Popover>
      </div>
    );
  },
};
