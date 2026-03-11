import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Toggle } from "./Toggle";

const meta: Meta<typeof Toggle> = {
  title: "DS/Toggle",
  component: Toggle,
};
export default meta;

type Story = StoryObj<typeof Toggle>;

export const Off: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return <Toggle checked={checked} onChange={setChecked} label="Dark mode" labelVisible />;
  },
};

export const On: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return <Toggle checked={checked} onChange={setChecked} label="Notifications" labelVisible />;
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-6">
      <Toggle checked={false} onChange={() => {}} label="Disabled off" labelVisible disabled />
      <Toggle checked={true} onChange={() => {}} label="Disabled on" labelVisible disabled />
    </div>
  ),
};

export const SrOnlyLabel: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return <Toggle checked={checked} onChange={setChecked} label="Toggle feature" />;
  },
};

export const AllStates: Story = {
  render: () => {
    const [v1, setV1] = useState(false);
    const [v2, setV2] = useState(true);
    return (
      <div className="flex flex-col gap-4 p-6">
        <Toggle checked={v1} onChange={setV1} label="Off state" labelVisible />
        <Toggle checked={v2} onChange={setV2} label="On state" labelVisible />
        <Toggle checked={false} onChange={() => {}} label="Disabled off" labelVisible disabled />
        <Toggle checked={true} onChange={() => {}} label="Disabled on" labelVisible disabled />
      </div>
    );
  },
};
