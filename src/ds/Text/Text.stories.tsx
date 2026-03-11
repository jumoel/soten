import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "./Text";

const meta: Meta<typeof Text> = {
  title: "DS/Text",
  component: Text,
};
export default meta;

type Story = StoryObj<typeof Text>;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-4">
      <Text variant="h1">Heading 1</Text>
      <Text variant="h2">Heading 2</Text>
      <Text variant="h3">Heading 3</Text>
      <Text variant="h4">Heading 4</Text>
      <Text variant="body">Body text in the default paper colour.</Text>
      <Text variant="body-dim">Body dim text for secondary content.</Text>
      <Text variant="meta">Meta text</Text>
      <Text variant="label">Label text</Text>
    </div>
  ),
};

export const Headings: Story = {
  render: () => (
    <div className="flex flex-col gap-2 p-4">
      <Text variant="h1">Page Title</Text>
      <Text variant="h2">Section Heading</Text>
      <Text variant="h3">Subsection</Text>
      <Text variant="h4">Group Label</Text>
    </div>
  ),
};

export const BodyVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-2 p-4">
      <Text variant="body">Primary body text for main content.</Text>
      <Text variant="body-dim">Dimmed body text for supplementary information.</Text>
    </div>
  ),
};

export const MetaAndLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2 p-4">
      <Text variant="meta">Section label</Text>
      <Text variant="label">Form label</Text>
    </div>
  ),
};

export const AsOverride: Story = {
  render: () => (
    <div className="flex flex-col gap-2 p-4">
      <Text variant="h2" as="div">
        h2 variant rendered as div
      </Text>
      <Text variant="body" as="span">
        body variant rendered as span
      </Text>
    </div>
  ),
};

export const WithClassName: Story = {
  render: () => (
    <div className="p-4">
      <Text variant="body" className="max-w-xs truncate">
        This text has a max-width and will truncate if it gets too long for the container.
      </Text>
    </div>
  ),
};
