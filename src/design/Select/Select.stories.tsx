import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Select } from "./Select";

const meta: Meta<typeof Select> = {
  title: "Design/Select",
  component: Select,
};
export default meta;

type Story = StoryObj<typeof Select>;

const basicOptions = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("apple");
    return (
      <div className="p-4 w-64">
        <Select value={value} onChange={setValue} options={basicOptions} label="Fruit" />
      </div>
    );
  },
};

export const Small: Story = {
  render: () => {
    const [value, setValue] = useState("apple");
    return (
      <div className="p-4 w-48">
        <Select value={value} onChange={setValue} options={basicOptions} label="Fruit" size="sm" />
      </div>
    );
  },
};

export const WithVisibleLabel: Story = {
  render: () => {
    const [value, setValue] = useState("banana");
    return (
      <div className="p-4 w-64">
        <Select
          value={value}
          onChange={setValue}
          options={basicOptions}
          label="Fruit"
          labelVisible={true}
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="p-4 w-64">
      <Select
        value="apple"
        onChange={() => {}}
        options={basicOptions}
        label="Fruit"
        disabled={true}
      />
    </div>
  ),
};

export const ManyOptions: Story = {
  render: () => {
    const [value, setValue] = useState("1");
    const options = Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: `Option ${i + 1}`,
    }));
    return (
      <div className="p-4 w-64">
        <Select value={value} onChange={setValue} options={options} label="Option" />
      </div>
    );
  },
};
