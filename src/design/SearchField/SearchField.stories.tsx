import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { SearchField } from "./SearchField";

const meta: Meta<typeof SearchField> = {
  title: "Design/SearchField",
  component: SearchField,
};
export default meta;

type Story = StoryObj<typeof SearchField>;

export const Empty: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <div className="p-4 w-80">
        <SearchField value={value} onChange={setValue} label="Search" placeholder="Search..." />
      </div>
    );
  },
};

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState("my search query");
    return (
      <div className="p-4 w-80">
        <SearchField value={value} onChange={setValue} label="Search" placeholder="Search..." />
      </div>
    );
  },
};

export const VisibleLabel: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <div className="p-4 w-80">
        <SearchField
          value={value}
          onChange={setValue}
          label="Search notes"
          placeholder="Search..."
          labelVisible={true}
        />
      </div>
    );
  },
};

export const FullWidth: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <div className="p-4">
        <SearchField
          value={value}
          onChange={setValue}
          label="Search"
          placeholder="Search all notes..."
        />
      </div>
    );
  },
};
