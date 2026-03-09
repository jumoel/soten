import type { Meta, StoryObj } from "@storybook/react-vite";
import { Grid } from "./Grid";
import { Box } from "../Box/Box";

const meta: Meta<typeof Grid> = {
  title: "Design/Grid",
  component: Grid,
};
export default meta;

type Story = StoryObj<typeof Grid>;

const Cell = ({ label }: { label: string }) => (
  <Box surface="surface" border="edge" padding="card" rounded>
    <span className="text-sm text-paper">{label}</span>
  </Box>
);

export const TwoColumns: Story = {
  render: () => (
    <Grid cols={2} className="p-4">
      {Array.from({ length: 6 }, (_, i) => (
        <Cell key={i} label={`Cell ${i + 1}`} />
      ))}
    </Grid>
  ),
};

export const ThreeColumns: Story = {
  render: () => (
    <Grid cols={3} className="p-4">
      {Array.from({ length: 6 }, (_, i) => (
        <Cell key={i} label={`Cell ${i + 1}`} />
      ))}
    </Grid>
  ),
};

export const FourColumns: Story = {
  render: () => (
    <Grid cols={4} className="p-4">
      {Array.from({ length: 8 }, (_, i) => (
        <Cell key={i} label={`Cell ${i + 1}`} />
      ))}
    </Grid>
  ),
};

export const NarrowViewport: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  render: () => (
    <Grid cols={4} className="p-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Cell key={i} label={`Cell ${i + 1}`} />
      ))}
    </Grid>
  ),
};

export const MixedContent: Story = {
  render: () => (
    <Grid cols={3} gap={4} className="p-4">
      <Box surface="surface" border="edge" padding="card" rounded>
        <p className="text-sm text-paper">Short content</p>
      </Box>
      <Box surface="surface" border="edge" padding="card" rounded>
        <p className="text-sm text-paper">
          A longer piece of content that takes up more vertical space than neighboring cells,
          testing alignment.
        </p>
      </Box>
      <Box surface="surface" border="edge" padding="card" rounded>
        <p className="text-sm text-paper">Medium length content here.</p>
      </Box>
    </Grid>
  ),
};
