import { cn } from "@/lib/utils";
import { getStatusInfo } from "@/lib/zip-api";

export function StatusBadge({ status }: { status: number }) {
  const info = getStatusInfo(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        info.color
      )}
    >
      {info.label}
    </span>
  );
}
