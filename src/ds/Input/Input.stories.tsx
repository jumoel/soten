import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "DS/Input",
  component: Input,
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return <Input value={value} onChange={setValue} label="Name" placeholder="Enter your name" />;
  },
};

export const WithVisibleLabel: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <Input
        value={value}
        onChange={setValue}
        label="Email"
        labelVisible
        placeholder="you@example.com"
        type="email"
      />
    );
  },
};

export const WithIcon: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <Input value={value} onChange={setValue} label="Search" placeholder="Search…" icon="search" />
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <Input value="Cannot edit" onChange={() => {}} label="Disabled" disabled labelVisible />
  ),
};

export const AllVariants: Story = {
  render: () => {
    const [v1, setV1] = useState("");
    const [v2, setV2] = useState("");
    const [v3, setV3] = useState("");
    return (
      <div className="flex flex-col gap-4 p-6 max-w-sm">
        <Input value={v1} onChange={setV1} label="Default" placeholder="Default input" />
        <Input
          value={v2}
          onChange={setV2}
          label="With label"
          labelVisible
          placeholder="Visible label"
        />
        <Input
          value={v3}
          onChange={setV3}
          label="With icon"
          placeholder="Icon input"
          icon="search"
        />
        <Input value="Disabled" onChange={() => {}} label="Disabled" disabled />
      </div>
    );
  },
};
