import { DataTable } from "./ds/DataTable";

export function FrontmatterTable({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;
  return <DataTable data={data} />;
}
