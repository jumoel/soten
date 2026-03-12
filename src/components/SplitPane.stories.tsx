import type { Meta, StoryObj } from "@storybook/react-vite";
import { SplitPane } from "./SplitPane";

const meta: Meta<typeof SplitPane> = {
  title: "Components/SplitPane",
  component: SplitPane,
};
export default meta;

type Story = StoryObj<typeof SplitPane>;

export const Default: Story = {
  render: () => (
    <div className="h-96 border border-edge rounded-md">
      <SplitPane
        top={
          <div className="p-4 bg-base h-full">
            <p className="text-sm text-paper">Top pane content (editor area)</p>
          </div>
        }
        bottom={
          <div className="p-4 bg-base h-full">
            <p className="text-sm text-paper">Bottom pane content (backlinks area)</p>
          </div>
        }
      />
    </div>
  ),
};

export const CustomRatio: Story = {
  render: () => (
    <div className="h-96 border border-edge rounded-md">
      <SplitPane
        initialRatio={0.5}
        top={
          <div className="p-4 bg-base h-full">
            <p className="text-sm text-paper">50/50 split</p>
          </div>
        }
        bottom={
          <div className="p-4 bg-base h-full">
            <p className="text-sm text-paper">Equal bottom pane</p>
          </div>
        }
      />
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="h-96 border border-edge rounded-md">
      <SplitPane
        direction="vertical"
        initialRatio={0.6}
        top={
          <div className="p-4 bg-base h-full">
            <p className="text-sm text-paper">Left pane (editor)</p>
          </div>
        }
        bottom={
          <div className="p-4 bg-base h-full">
            <p className="text-sm text-paper">Right pane (references)</p>
          </div>
        }
      />
    </div>
  ),
};

export const NestedSplitPanes: Story = {
  render: () => (
    <div className="h-96 border border-edge rounded-md">
      <SplitPane
        direction="vertical"
        initialRatio={0.6}
        top={
          <SplitPane
            top={
              <div className="p-4 bg-base h-full">
                <p className="text-sm text-paper">Editor (top-left)</p>
              </div>
            }
            bottom={
              <div className="p-4 bg-base h-full">
                <p className="text-sm text-paper">Backlinks (bottom-left)</p>
              </div>
            }
          />
        }
        bottom={
          <div className="p-4 bg-base h-full">
            <p className="text-sm text-paper">References (right)</p>
          </div>
        }
      />
    </div>
  ),
};
