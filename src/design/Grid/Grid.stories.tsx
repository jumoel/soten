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
    <div className="p-4">
      <Grid cols={2}>
        {Array.from({ length: 6 }, (_, i) => (
          <Cell key={i} label={`Cell ${i + 1}`} />
        ))}
      </Grid>
    </div>
  ),
};

export const ThreeColumns: Story = {
  render: () => (
    <div className="p-4">
      <Grid cols={3}>
        {Array.from({ length: 6 }, (_, i) => (
          <Cell key={i} label={`Cell ${i + 1}`} />
        ))}
      </Grid>
    </div>
  ),
};

export const FourColumns: Story = {
  render: () => (
    <div className="p-4">
      <Grid cols={4}>
        {Array.from({ length: 8 }, (_, i) => (
          <Cell key={i} label={`Cell ${i + 1}`} />
        ))}
      </Grid>
    </div>
  ),
};

export const NarrowViewport: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  render: () => (
    <div className="p-4">
      <Grid cols={4}>
        {Array.from({ length: 4 }, (_, i) => (
          <Cell key={i} label={`Cell ${i + 1}`} />
        ))}
      </Grid>
    </div>
  ),
};

export const MixedContent: Story = {
  render: () => (
    <div className="p-4">
      <Grid cols={3} gap={4}>
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
    </div>
  ),
};
