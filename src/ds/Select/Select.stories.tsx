import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Select } from "./Select";

const meta: Meta<typeof Select> = {
  title: "DS/Select",
  component: Select,
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("newest");
    return (
      <Select
        value={value}
        onChange={setValue}
        label="Sort order"
        options={[
          { value: "newest", label: "Newest" },
          { value: "oldest", label: "Oldest" },
          { value: "best-match", label: "Best match" },
        ]}
      />
    );
  },
};

export const WithVisibleLabel: Story = {
  render: () => {
    const [value, setValue] = useState("light");
    return (
      <Select
        value={value}
        onChange={setValue}
        label="Theme"
        labelVisible
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "system", label: "System" },
        ]}
      />
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <Select
      value="only"
      onChange={() => {}}
      label="Disabled"
      disabled
      labelVisible
      options={[{ value: "only", label: "Only option" }]}
    />
  ),
};

export const AllVariants: Story = {
  render: () => {
    const [v1, setV1] = useState("a");
    const [v2, setV2] = useState("x");
    return (
      <div className="flex flex-col gap-4 p-6 max-w-sm">
        <Select
          value={v1}
          onChange={setV1}
          label="Default"
          options={[
            { value: "a", label: "Option A" },
            { value: "b", label: "Option B" },
            { value: "c", label: "Option C" },
          ]}
        />
        <Select
          value={v2}
          onChange={setV2}
          label="With visible label"
          labelVisible
          options={[
            { value: "x", label: "Choice X" },
            { value: "y", label: "Choice Y" },
          ]}
        />
        <Select
          value="d"
          onChange={() => {}}
          label="Disabled select"
          disabled
          labelVisible
          options={[{ value: "d", label: "Disabled" }]}
        />
      </div>
    );
  },
};
