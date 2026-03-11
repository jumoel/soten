import type { Meta, StoryObj } from "@storybook/react-vite";
import { Grid } from "./Grid";

const meta: Meta<typeof Grid> = {
  title: "DS/Grid",
  component: Grid,
};
export default meta;

type Story = StoryObj<typeof Grid>;

const Cell = ({ label }: { label: string }) => (
  <div className="bg-surface border border-edge rounded-md px-3 py-2 text-sm text-paper">
    {label}
  </div>
);

export const TwoCols: Story = {
  render: () => (
    <div className="p-4">
      <Grid cols={2} gap={3}>
        <Cell label="1" />
        <Cell label="2" />
        <Cell label="3" />
        <Cell label="4" />
      </Grid>
    </div>
  ),
};

export const ThreeCols: Story = {
  render: () => (
    <div className="p-4">
      <Grid cols={3} gap={3}>
        <Cell label="1" />
        <Cell label="2" />
        <Cell label="3" />
        <Cell label="4" />
        <Cell label="5" />
        <Cell label="6" />
      </Grid>
    </div>
  ),
};

export const FourCols: Story = {
  render: () => (
    <div className="p-4">
      <Grid cols={4} gap={4}>
        <Cell label="1" />
        <Cell label="2" />
        <Cell label="3" />
        <Cell label="4" />
        <Cell label="5" />
        <Cell label="6" />
        <Cell label="7" />
        <Cell label="8" />
      </Grid>
    </div>
  ),
};

export const AllGaps: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-4">
      {([2, 3, 4, 6] as const).map((gap) => (
        <div key={gap}>
          <div className="text-xs text-muted mb-2">gap={gap}</div>
          <Grid cols={3} gap={gap}>
            <Cell label="A" />
            <Cell label="B" />
            <Cell label="C" />
          </Grid>
        </div>
      ))}
    </div>
  ),
};

export const WithClassName: Story = {
  render: () => (
    <div className="p-4">
      <Grid cols={2} gap={3} className="max-w-md">
        <Cell label="1" />
        <Cell label="2" />
        <Cell label="3" />
        <Cell label="4" />
      </Grid>
    </div>
  ),
};
