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
            <td className="py-1 pr-4 text-sm text-gray-500 align-top">{key}</td>
            <td className="py-1 text-sm font-mono">
              {typeof value === "string" ? value : JSON.stringify(value)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
