const widthMap = {
  full: "w-full",
  "3/4": "w-3/4",
  "5/6": "w-5/6",
  "2/3": "w-2/3",
  "1/2": "w-1/2",
} as const;

export function Skeleton({ width = "full" }: { width?: keyof typeof widthMap }) {
  return <div className={`h-3 rounded bg-surface-2 animate-pulse ${widthMap[width]}`} />;
}
