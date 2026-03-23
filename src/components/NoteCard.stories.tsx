import type { Meta, StoryObj } from "@storybook/react-vite";
import { NoteCard } from "./NoteCard";

const meta: Meta<typeof NoteCard> = {
  title: "Components/NoteCard",
  component: NoteCard,
};
export default meta;

type Story = StoryObj<typeof NoteCard>;

export const Default: Story = {
  render: () => (
    <div className="p-6 max-w-sm">
      <NoteCard
        title="March 10, 2025"
        date="Mar 10, 2025"
        previewHtml="Started working on the new design system today. Need to finalize color tokens."
        isPinned={false}
        isDraft={false}
        onPin={() => {}}
        onOpen={() => {}}
      />
    </div>
  ),
};

export const Pinned: Story = {
  render: () => (
    <div className="p-6 max-w-sm">
      <NoteCard
        title="Project Ideas"
        date="Feb 28, 2025"
        previewHtml="Collection of project ideas for Q2 planning."
        isPinned={true}
        isDraft={false}
        onPin={() => {}}
        onOpen={() => {}}
      />
    </div>
  ),
};

export const Draft: Story = {
  render: () => (
    <div className="p-6 max-w-sm">
      <NoteCard
        title="10:30 AM"
        date="Mar 11, 2025"
        previewHtml="Work in progress..."
        isPinned={false}
        isDraft={true}
        onPin={() => {}}
        onOpen={() => {}}
      />
    </div>
  ),
};

export const PinnedDraft: Story = {
  render: () => (
    <div className="p-6 max-w-sm">
      <NoteCard
        title="Meeting Notes"
        date="Mar 9, 2025"
        previewHtml="Weekly standup with the team. Action items: follow up on deployment."
        isPinned={true}
        isDraft={true}
        onPin={() => {}}
        onOpen={() => {}}
      />
    </div>
  ),
};

export const LongPreview: Story = {
  render: () => (
    <div className="p-6 max-w-sm">
      <NoteCard
        title="Research Notes"
        date={null}
        previewHtml="This is a much longer preview text that should be truncated after two lines. It contains a lot of information about the research topic including background context and preliminary findings."
        isPinned={false}
        isDraft={false}
        onPin={() => {}}
        onOpen={() => {}}
      />
    </div>
  ),
};
