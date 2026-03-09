import type { Preview } from "@storybook/react-vite";
import "../src/index.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#f7f6f3" },
        { name: "dark", value: "#000000" },
      ],
    },
  },
};

export default preview;
