import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { TopBar } from "./TopBar";
import { Button } from "../Button/Button";
import { SearchField } from "../SearchField/SearchField";
import { Text } from "../Text/Text";

const meta: Meta<typeof TopBar> = {
  title: "Design/TopBar",
  component: TopBar,
};
export default meta;

type Story = StoryObj<typeof TopBar>;

export const WithAllSlots: Story = {
  render: () => {
    const [search, setSearch] = useState("");
    return (
      <TopBar
        left={<Text variant="h3">Soten</Text>}
        center={
          <SearchField
            value={search}
            onChange={setSearch}
            label="Search"
            placeholder="Search notes..."
          />
        }
        right={
          <>
            <Button variant="ghost" size="sm">
              Settings
            </Button>
            <Button variant="primary" size="sm">
              New note
            </Button>
          </>
        }
      />
    );
  },
};

export const LeftOnly: Story = {
  render: () => <TopBar left={<Text variant="h3">My App</Text>} />,
};

export const RightOnly: Story = {
  render: () => (
    <TopBar
      right={
        <>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button variant="primary" size="sm">
            Save
          </Button>
        </>
      }
    />
  ),
};

export const Sticky: Story = {
  render: () => (
    <div className="h-64 overflow-y-auto border border-edge rounded-md">
      <TopBar
        sticky
        left={<Text variant="h3">Sticky TopBar</Text>}
        right={
          <Button variant="ghost" size="sm">
            Action
          </Button>
        }
      />
      <div className="p-4 flex flex-col gap-3">
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i} className="text-sm text-paper">
            Scroll content line {i + 1}
          </p>
        ))}
      </div>
    </div>
  ),
};
