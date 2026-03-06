import { Text } from "./ds/Text";

export function FrontmatterTable({ data }: { data: Record<string, unknown> | null }) {
  const keys = Object.entries(data ?? {});

  if (keys.length === 0) {
    return null;
  }

  return (
    <table className="mb-4">
      <tbody>
        {keys.map(([key, value]) => (
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
