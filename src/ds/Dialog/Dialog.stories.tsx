import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Dialog } from "./Dialog";

const meta: Meta<typeof Dialog> = {
  title: "DS/Dialog",
  component: Dialog,
};
export default meta;

type Story = StoryObj<typeof Dialog>;

function DialogDemo({ title }: { title?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-accent text-white dark:text-black font-medium rounded-md px-4 py-2 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Open dialog
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title}>
        <p className="text-sm text-paper">
          This is the dialog content. Press Escape or click the backdrop to close.
        </p>
      </Dialog>
    </div>
  );
}

export const WithTitle: Story = {
  render: () => <DialogDemo title="Confirm action" />,
};

export const WithoutTitle: Story = {
  render: () => <DialogDemo />,
};

function ConfirmDialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-error-surface text-error-text font-medium rounded-md border border-error-edge px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Delete note
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Delete note?">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-paper">
            This will permanently delete the note. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-surface border border-edge text-paper font-medium rounded-md px-3 py-1.5 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-accent text-white dark:text-black font-medium rounded-md px-3 py-1.5 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Delete
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export const ConfirmDialog: Story = {
  render: () => <ConfirmDialogDemo />,
};
