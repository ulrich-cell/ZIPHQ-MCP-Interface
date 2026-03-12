interface AttributePanelProps {
  attributes: Record<string, unknown>;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AttributePanel({ attributes }: AttributePanelProps) {
  const entries = Object.entries(attributes).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">No attributes found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Attributes
        </h3>
      </div>
      <dl className="divide-y divide-border">
        {entries.map(([key, value]) => (
          <div key={key} className="flex gap-4 px-5 py-3">
            <dt className="w-1/3 shrink-0 text-sm font-medium text-muted-foreground">
              {formatKey(key)}
            </dt>
            <dd className="text-sm text-card-foreground break-words">
              {formatValue(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
