import { Text } from "../ds";

export function FrontmatterTable({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;

  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {entries.map(([label, value]) => (
        <div key={label} className="contents">
          <dt>
            <Text variant="meta" as="span">
              {label}
            </Text>
          </dt>
          <dd>
            <Text variant="body" as="span">
              {typeof value === "string" ? value : JSON.stringify(value)}
            </Text>
          </dd>
        </div>
      ))}
    </dl>
  );
}
