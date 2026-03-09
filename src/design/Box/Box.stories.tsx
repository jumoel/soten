import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "./Box";

const meta: Meta<typeof Box> = {
  title: "Design/Box",
  component: Box,
};
export default meta;

type Story = StoryObj<typeof Box>;

export const Surface: Story = {
  render: () => (
    <div className="flex gap-4 bg-base p-4">
      <Box surface="base" padding="card" border="edge">
        surface=base
      </Box>
      <Box surface="surface" padding="card" border="edge">
        surface=surface
      </Box>
      <Box surface="surface-2" padding="card" border="edge">
        surface=surface-2
      </Box>
    </div>
  ),
};

export const Borders: Story = {
  render: () => (
    <div className="flex gap-4 p-4">
      <Box padding="card" border="edge">
        border=edge
      </Box>
      <Box padding="card" border="edge-2">
        border=edge-2
      </Box>
    </div>
  ),
};

export const Padding: Story = {
  render: () => (
    <div className="flex gap-4 p-4">
      <Box surface="surface" border="edge" padding="compact">
        padding=compact
      </Box>
      <Box surface="surface" border="edge" padding="card">
        padding=card
      </Box>
      <Box surface="surface" border="edge" padding="page">
        padding=page
      </Box>
    </div>
  ),
};

export const Rounded: Story = {
  render: () => (
    <div className="flex gap-4 p-4">
      <Box surface="surface" border="edge" padding="card" rounded={true}>
        rounded=true
      </Box>
      <Box surface="surface" border="edge" padding="card" rounded={false}>
        rounded=false
      </Box>
    </div>
  ),
};

export const AsSemanticElement: Story = {
  render: () => (
    <div className="flex gap-4 p-4">
      <Box as="section" surface="surface" border="edge" padding="card" rounded>
        as=section
      </Box>
      <Box as="aside" surface="surface" border="edge" padding="card" rounded>
        as=aside
      </Box>
    </div>
  ),
};

export const DarkMode: Story = {
  decorators: [
    (Story) => {
      document.documentElement.classList.add("dark");
      return <Story />;
    },
  ],
  render: () => (
    <div className="flex gap-4 bg-base p-4">
      <Box surface="surface" border="edge" padding="card" rounded>
        surface=surface
      </Box>
      <Box surface="surface-2" border="edge-2" padding="card" rounded>
        surface=surface-2
      </Box>
    </div>
  ),
};
