import type { Meta, StoryObj } from "@storybook/react-vite";
import { NoteCardCondensed } from "./NoteCardCondensed";

const meta: Meta<typeof NoteCardCondensed> = {
  title: "Components/NoteCardCondensed",
  component: NoteCardCondensed,
};
export default meta;

type Story = StoryObj<typeof NoteCardCondensed>;

export const Default: Story = {
  render: () => (
    <div className="p-6 max-w-md">
      <NoteCardCondensed title="March 10, 2025" date="Mar 10, 2025" onOpen={() => {}} />
    </div>
  ),
};

export const WithAddButton: Story = {
  render: () => (
    <div className="p-6 max-w-md">
      <NoteCardCondensed
        title="Project Ideas"
        date="Feb 28, 2025"
        onOpen={() => {}}
        onAdd={() => {}}
      />
    </div>
  ),
};

export const LongTitle: Story = {
  render: () => (
    <div className="p-6 max-w-md">
      <NoteCardCondensed
        title="A very long note title that should truncate gracefully in the condensed view"
        date="Jan 15, 2025"
        onOpen={() => {}}
        onAdd={() => {}}
      />
    </div>
  ),
};

export const NoDate: Story = {
  render: () => (
    <div className="p-6 max-w-md">
      <NoteCardCondensed title="Quick Thought" date={null} onOpen={() => {}} onAdd={() => {}} />
    </div>
  ),
};
