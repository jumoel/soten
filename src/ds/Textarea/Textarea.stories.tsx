import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "DS/Textarea",
  component: Textarea,
};
export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <Textarea value={value} onChange={setValue} label="Notes" placeholder="Write something…" />
    );
  },
};

export const WithVisibleLabel: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <Textarea
        value={value}
        onChange={setValue}
        label="Description"
        labelVisible
        placeholder="Describe the item…"
      />
    );
  },
};

export const Small: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <Textarea
        value={value}
        onChange={setValue}
        label="Comment"
        size="sm"
        rows={4}
        placeholder="Quick note…"
      />
    );
  },
};

export const Monospace: Story = {
  render: () => {
    const [value, setValue] = useState("const x = 42;");
    return <Textarea value={value} onChange={setValue} label="Code" mono labelVisible />;
  },
};

export const Disabled: Story = {
  render: () => (
    <Textarea
      value="This content cannot be edited."
      onChange={() => {}}
      label="Locked"
      disabled
      labelVisible
    />
  ),
};

export const AllVariants: Story = {
  render: () => {
    const [v1, setV1] = useState("");
    const [v2, setV2] = useState("");
    const [v3, setV3] = useState("function hello() {\n  return 'world';\n}");
    return (
      <div className="flex flex-col gap-4 p-6 max-w-md">
        <Textarea
          value={v1}
          onChange={setV1}
          label="Default (md)"
          labelVisible
          placeholder="Default size"
        />
        <Textarea
          value={v2}
          onChange={setV2}
          label="Small"
          labelVisible
          size="sm"
          rows={3}
          placeholder="Small textarea"
        />
        <Textarea value={v3} onChange={setV3} label="Monospace" labelVisible mono rows={4} />
        <Textarea
          value="Read-only content"
          onChange={() => {}}
          label="Disabled"
          labelVisible
          disabled
        />
      </div>
    );
  },
};
