import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect } from "react";
import "../src/index.css";

const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme ?? "light";
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [theme]);
  return <Story />;
};

const preview: Preview = {
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Color theme",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
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
