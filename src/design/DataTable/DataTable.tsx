import { Fragment, type ReactNode } from "react";

export type DataTableEntry = {
  label: string;
  value: ReactNode;
};

export type DataTableProps = {
  entries: DataTableEntry[];
  layout?: "horizontal" | "vertical";
};

export function DataTable({ entries, layout = "horizontal" }: DataTableProps) {
  if (entries.length === 0) return null;

  if (layout === "vertical") {
    return (
      <dl className="flex flex-col gap-2 mb-4">
        {entries.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-sm font-semibold uppercase tracking-widest leading-none text-muted">
              {label}
            </dt>
            <dd className="text-base font-normal leading-tight text-paper">{value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className="grid mb-4" style={{ gridTemplateColumns: "auto 1fr" }}>
      {entries.map(({ label, value }) => (
        <Fragment key={label}>
          <dt className="py-1 pr-4 text-sm font-semibold uppercase tracking-widest leading-none text-muted">
            {label}
          </dt>
          <dd className="py-1 text-base font-normal leading-tight text-paper">{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
