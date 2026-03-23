import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "./Alert";

const meta: Meta<typeof Alert> = {
  title: "DS/Alert",
  component: Alert,
};
export default meta;

type Story = StoryObj<typeof Alert>;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6">
      <Alert variant="info">This is an informational message.</Alert>
      <Alert variant="warning">This is a warning message.</Alert>
      <Alert variant="error">This is an error message.</Alert>
    </div>
  ),
};

export const WithTitle: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6">
      <Alert variant="info" title="Did you know?">
        You can access your notes from any device by signing in with GitHub.
      </Alert>
      <Alert variant="warning" title="Unsaved changes">
        Your note has unsaved changes. Remember to save before leaving.
      </Alert>
      <Alert variant="error" title="Sync failed">
        Unable to sync with GitHub. Check your connection and try again.
      </Alert>
    </div>
  ),
};

export const WithoutTitle: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6">
      <Alert variant="info">Connected to your GitHub repository.</Alert>
      <Alert variant="warning">You are working in offline mode.</Alert>
      <Alert variant="error">Failed to load notes.</Alert>
    </div>
  ),
};

export const LongContent: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6 max-w-lg">
      <Alert variant="warning" title="Repository not found">
        The repository you linked could not be found. This may be because the repository was
        deleted, renamed, or the GitHub App no longer has access. Please re-link your repository in
        settings to continue syncing your notes.
      </Alert>
    </div>
  ),
};
