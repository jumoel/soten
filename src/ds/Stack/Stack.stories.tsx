import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "./Stack";

const meta: Meta<typeof Stack> = {
  title: "DS/Stack",
  component: Stack,
};
export default meta;

type Story = StoryObj<typeof Stack>;

const Item = ({ label }: { label: string }) => (
  <div className="bg-surface border border-edge rounded-md px-3 py-2 text-sm text-paper">
    {label}
  </div>
);

export const DefaultGap: Story = {
  render: () => (
    <div className="p-4">
      <Stack>
        <Item label="Item 1" />
        <Item label="Item 2" />
        <Item label="Item 3" />
      </Stack>
    </div>
  ),
};

export const AllGaps: Story = {
  render: () => (
    <div className="flex gap-8 p-4">
      {([1, 2, 3, 4, 6] as const).map((gap) => (
        <div key={gap}>
          <div className="text-xs text-muted mb-2">gap={gap}</div>
          <Stack gap={gap}>
            <Item label="A" />
            <Item label="B" />
            <Item label="C" />
          </Stack>
        </div>
      ))}
    </div>
  ),
};

export const Alignment: Story = {
  render: () => (
    <div className="flex gap-8 p-4">
      {(["start", "center", "end", "stretch"] as const).map((align) => (
        <div key={align}>
          <div className="text-xs text-muted mb-2">align={align}</div>
          <div className="w-32 bg-surface-2 p-2 rounded-md">
            <Stack align={align}>
              <Item label="Short" />
              <Item label="A longer item" />
            </Stack>
          </div>
        </div>
      ))}
    </div>
  ),
};

export const Justify: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      {(["start", "center", "end", "between"] as const).map((justify) => (
        <div key={justify}>
          <div className="text-xs text-muted mb-2">justify={justify}</div>
          <Stack direction="horizontal" justify={justify}>
            <Item label="A" />
            <Item label="B" />
            <Item label="C" />
          </Stack>
        </div>
      ))}
    </div>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <div className="p-4">
      <Stack direction="horizontal" gap={3}>
        <Item label="Left" />
        <Item label="Center" />
        <Item label="Right" />
      </Stack>
    </div>
  ),
};

export const AsUl: Story = {
  render: () => (
    <div className="p-4">
      <Stack as="ul" gap={1}>
        <li className="text-sm text-paper">First item</li>
        <li className="text-sm text-paper">Second item</li>
        <li className="text-sm text-paper">Third item</li>
      </Stack>
    </div>
  ),
};

export const WithClassName: Story = {
  render: () => (
    <div className="p-4">
      <Stack className="max-w-xs">
        <Item label="Constrained width" />
        <Item label="Via className" />
      </Stack>
    </div>
  ),
};
