import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { CalendarGrid } from "./CalendarGrid";

const meta: Meta<typeof CalendarGrid> = {
  title: "Components/CalendarGrid",
  component: CalendarGrid,
};
export default meta;

type Story = StoryObj<typeof CalendarGrid>;

function CalendarDemo() {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(2);
  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);

  const noteCounts = new Map([
    [1, 1],
    [3, 2],
    [5, 4],
    [10, 1],
    [12, 3],
    [15, 1],
    [20, 2],
    [25, 5],
  ]);

  const handleChangeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }
    setMonth(m);
    setYear(y);
    setSelectedRange(null);
  };

  return (
    <div className="p-6 max-w-xs">
      <CalendarGrid
        year={year}
        month={month}
        weekStart={1}
        noteCounts={noteCounts}
        activeDays={null}
        selectedRange={selectedRange}
        onSelectRange={setSelectedRange}
        onChangeMonth={handleChangeMonth}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <CalendarDemo />,
};

export const WithSearchFilter: Story = {
  render: () => (
    <div className="p-6 max-w-xs">
      <CalendarGrid
        year={2025}
        month={2}
        weekStart={1}
        noteCounts={
          new Map([
            [1, 1],
            [3, 2],
            [10, 1],
            [15, 3],
            [20, 1],
          ])
        }
        activeDays={new Set([3, 15])}
        selectedRange={null}
        onSelectRange={() => {}}
        onChangeMonth={() => {}}
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="p-6 max-w-xs">
      <CalendarGrid
        year={2025}
        month={2}
        weekStart={1}
        noteCounts={new Map()}
        activeDays={null}
        selectedRange={null}
        onSelectRange={() => {}}
        onChangeMonth={() => {}}
      />
    </div>
  ),
};
