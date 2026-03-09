import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "Design/Textarea",
  component: Textarea,
};
export default meta;

type Story = StoryObj<typeof Textarea>;

const sampleMarkdown = `# Hello World

This is a **markdown** note with some content.

- Item one
- Item two
- Item three
`;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <div className="p-4 w-96">
        <Textarea value={value} onChange={setValue} label="Note" placeholder="Write something..." />
      </div>
    );
  },
};

export const WithContent: Story = {
  render: () => {
    const [value, setValue] = useState(sampleMarkdown);
    return (
      <div className="p-4 w-96">
        <Textarea value={value} onChange={setValue} label="Note" />
      </div>
    );
  },
};

export const Mono: Story = {
  render: () => {
    const [value, setValue] = useState(sampleMarkdown);
    return (
      <div className="p-4 w-96">
        <Textarea value={value} onChange={setValue} label="Note" mono={true} />
      </div>
    );
  },
};

export const Small: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <div className="p-4 w-80">
        <Textarea
          value={value}
          onChange={setValue}
          label="Note"
          size="sm"
          rows={4}
          placeholder="Small textarea..."
        />
      </div>
    );
  },
};

export const WithVisibleLabel: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <div className="p-4 w-96">
        <Textarea
          value={value}
          onChange={setValue}
          label="Markdown content"
          labelVisible={true}
          placeholder="Write markdown here..."
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="p-4 w-96">
      <Textarea
        value={sampleMarkdown}
        onChange={() => {}}
        label="Note"
        disabled={true}
        labelVisible={true}
      />
    </div>
  ),
};

export const FullHeight: Story = {
  render: () => {
    const [value, setValue] = useState(sampleMarkdown);
    return (
      <div className="p-4 h-64 flex flex-col">
        <Textarea value={value} onChange={setValue} label="Note" mono={true} className="flex-1" />
      </div>
    );
  },
};

export const DarkMode: Story = {
  decorators: [
    (Story) => {
      document.documentElement.classList.add("dark");
      return <Story />;
    },
  ],
  render: () => {
    const [value, setValue] = useState(sampleMarkdown);
    return (
      <div className="bg-base p-4 w-96">
        <Textarea value={value} onChange={setValue} label="Note" mono={true} labelVisible={true} />
      </div>
    );
  },
};
