import type { Meta, StoryObj } from "@storybook/react-vite";
import { MarkdownContent } from "./MarkdownContent";

const meta: Meta<typeof MarkdownContent> = {
  title: "Components/MarkdownContent",
  component: MarkdownContent,
};
export default meta;

type Story = StoryObj<typeof MarkdownContent>;

export const Default: Story = {
  render: () => (
    <div className="p-6 max-w-prose">
      <MarkdownContent html="<h2>Hello World</h2><p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p><ul><li>Item one</li><li>Item two</li></ul>" />
    </div>
  ),
};

export const WithCode: Story = {
  render: () => (
    <div className="p-6 max-w-prose">
      <MarkdownContent html="<p>Here is some <code>inline code</code> and a block:</p><pre><code>const x = 42;\nconsole.log(x);</code></pre>" />
    </div>
  ),
};

export const WithWikilink: Story = {
  render: () => (
    <div className="p-6 max-w-prose">
      <MarkdownContent html="<p>See also <span data-wikilink>Project Ideas</span> for more context.</p>" />
    </div>
  ),
};
