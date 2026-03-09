import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "./Stack";

const meta: Meta<typeof Stack> = {
  title: "Design/Stack",
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
    <Stack className="p-4">
      <Item label="Item 1" />
      <Item label="Item 2" />
      <Item label="Item 3" />
    </Stack>
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
          <Stack align={align} className="w-32 bg-surface-2 p-2 rounded-md">
            <Item label="Short" />
            <Item label="A longer item" />
          </Stack>
        </div>
      ))}
    </div>
  ),
};

export const AsUl: Story = {
  render: () => (
    <Stack as="ul" gap={1} className="list-none p-4">
      <li className="text-sm text-paper">First item</li>
      <li className="text-sm text-paper">Second item</li>
      <li className="text-sm text-paper">Third item</li>
    </Stack>
  ),
};
