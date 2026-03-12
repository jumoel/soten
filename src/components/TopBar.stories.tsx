import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton, Text } from "../ds";
import { TopBar } from "./TopBar";

const meta: Meta<typeof TopBar> = {
  title: "Components/TopBar",
  component: TopBar,
};
export default meta;

type Story = StoryObj<typeof TopBar>;

export const Default: Story = {
  render: () => (
    <TopBar
      left={
        <Text variant="h3" as="span" className="text-sm">
          Soten
        </Text>
      }
      center={
        <Text variant="meta" as="span">
          Synced
        </Text>
      }
      right={<IconButton icon="settings" size="sm" aria-label="Settings" />}
    />
  ),
};

export const LeftOnly: Story = {
  render: () => (
    <TopBar
      left={
        <Text variant="h3" as="span" className="text-sm">
          App Name
        </Text>
      }
    />
  ),
};

export const WithBackButton: Story = {
  render: () => (
    <TopBar
      left={<IconButton icon="chevron-left" size="sm" aria-label="Back" />}
      center={
        <Text variant="h3" as="span" className="text-sm">
          Settings
        </Text>
      }
    />
  ),
};
