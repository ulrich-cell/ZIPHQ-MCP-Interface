"use client";

import {
  Database,
  Users,
  Monitor,
  Lock,
  Award,
  Bot,
  MapPin,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Minus,
} from "lucide-react";

interface FieldEntry {
  label: string;
  value: string;
}

// Map well-known security field labels to icons
const ICON_MAP: Record<string, React.ReactNode> = {
  "store miro data":        <Database className="h-3.5 w-3.5" />,
  "direct customer access": <Users className="h-3.5 w-3.5" />,
  "access to it":           <Monitor className="h-3.5 w-3.5" />,
  "intellectual property":  <Lock className="h-3.5 w-3.5" />,
  "iso":                    <Award className="h-3.5 w-3.5" />,
  "soc":                    <Award className="h-3.5 w-3.5" />,
  "uses ai":                <Bot className="h-3.5 w-3.5" />,
  "vendor onsite":          <MapPin className="h-3.5 w-3.5" />,
};

function getIcon(label: string): React.ReactNode {
  const lower = label.toLowerCase();
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return <ShieldAlert className="h-3.5 w-3.5" />;
}

type Sentiment = "yes" | "no" | "neutral" | "text";

function getSentiment(value: string): Sentiment {
  const v = value.toLowerCase().trim();
  if (v === "yes" || v === "true") return "yes";
  if (v === "no" || v === "false" || v === "none") return "no";
  if (v === "—" || v === "" || v === "n/a") return "neutral";
  return "text";
}

// Some fields flagging "yes" are a risk (e.g. stores data, accesses IT),
// others are positive (e.g. ISO certified). Treat them all as neutral-amber
// since context matters — we just highlight clearly.
function BooleanCard({ label, value }: FieldEntry) {
  const sentiment = getSentiment(value);

  const styles = {
    yes: {
      card: "border-amber-500/30 bg-amber-500/5",
      badge: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
      icon: "text-amber-400",
      indicator: <ShieldAlert className="h-3 w-3" />,
    },
    no: {
      card: "border-border bg-card",
      badge: "bg-muted text-muted-foreground border border-border",
      icon: "text-muted-foreground/50",
      indicator: <ShieldX className="h-3 w-3" />,
    },
    neutral: {
      card: "border-border bg-card",
      badge: "bg-muted text-muted-foreground border border-border",
      icon: "text-muted-foreground/40",
      indicator: <Minus className="h-3 w-3" />,
    },
    text: {
      card: "border-blue-500/20 bg-blue-500/5",
      badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
      icon: "text-blue-400/70",
      indicator: <ShieldCheck className="h-3 w-3" />,
    },
  }[sentiment];

  return (
    <div className={`rounded-lg border px-3 py-2.5 flex items-center justify-between gap-3 transition-colors ${styles.card}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`shrink-0 ${styles.icon}`}>{getIcon(label)}</span>
        <p className="text-xs font-medium text-card-foreground truncate">{label}</p>
      </div>
      <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}>
        {styles.indicator}
        {value}
      </span>
    </div>
  );
}

export function SecurityPanel({ fields }: { fields: FieldEntry[] }) {
  if (fields.length === 0) {
    return (
      <p className="px-5 py-4 text-sm text-muted-foreground">
        No security or privacy fields found on this ticket.
      </p>
    );
  }

  // Split boolean-ish fields (Yes/No) from richer text fields
  const boolFields = fields.filter((f) => getSentiment(f.value) !== "text");
  const textFields = fields.filter((f) => getSentiment(f.value) === "text");

  return (
    <div className="p-4 space-y-3">
      {boolFields.length > 0 && (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {boolFields.map((f) => (
            <BooleanCard key={f.label} {...f} />
          ))}
        </div>
      )}
      {textFields.length > 0 && (
        <dl className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {textFields.map(({ label, value }) => (
            <div key={label} className="flex gap-4 px-4 py-3">
              <dt className="w-2/5 shrink-0 text-sm font-medium text-muted-foreground">{label}</dt>
              <dd className="text-sm text-card-foreground break-words whitespace-pre-wrap">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
