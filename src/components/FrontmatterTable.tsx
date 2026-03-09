import { DataTable } from "../design";

export function FrontmatterTable({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;

  const entries = Object.entries(data).map(([label, value]) => ({
    label,
    value: typeof value === "string" ? value : JSON.stringify(value),
  }));

  return <DataTable entries={entries} />;
}
