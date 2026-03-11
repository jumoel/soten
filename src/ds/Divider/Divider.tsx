type DividerOrientation = "horizontal" | "vertical";

export type DividerProps = {
  orientation?: DividerOrientation;
};

export function Divider({ orientation = "horizontal" }: DividerProps) {
  if (orientation === "vertical") {
    return <div className="border-l border-edge h-full self-stretch" />;
  }

  return <hr className="border-t border-edge" />;
}
