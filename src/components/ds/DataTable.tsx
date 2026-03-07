import { Text } from "./Text";

export function DataTable({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  return (
    <table className="mb-4">
      <tbody>
        {entries.map(([key, value]) => (
          <tr key={key}>
            <td className="py-1 pr-4 align-top">
              <Text variant="secondary" as="span">
                {key}
              </Text>
            </td>
            <td className="py-1">
              <Text variant="mono">
                {typeof value === "string" ? value : JSON.stringify(value)}
              </Text>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
