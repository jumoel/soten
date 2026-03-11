import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { SearchField } from "./SearchField";

const meta: Meta<typeof SearchField> = {
  title: "DS/SearchField",
  component: SearchField,
};
export default meta;

type Story = StoryObj<typeof SearchField>;

export const Empty: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return <SearchField value={value} onChange={setValue} label="Search" placeholder="Search…" />;
  },
};

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState("markdown");
    return <SearchField value={value} onChange={setValue} label="Search" placeholder="Search…" />;
  },
};

export const WithVisibleLabel: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <SearchField
        value={value}
        onChange={setValue}
        label="Search files"
        labelVisible
        placeholder="Type to filter…"
      />
    );
  },
};

export const AllStates: Story = {
  render: () => {
    const [v1, setV1] = useState("");
    const [v2, setV2] = useState("notes");
    return (
      <div className="flex flex-col gap-4 p-6 max-w-sm">
        <SearchField value={v1} onChange={setV1} label="Empty" placeholder="Search…" />
        <SearchField value={v2} onChange={setV2} label="With value" placeholder="Search…" />
        <SearchField
          value=""
          onChange={setV1}
          label="With label"
          labelVisible
          placeholder="Visible label"
        />
      </div>
    );
  },
};
