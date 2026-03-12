import { FileText, Image, File, FileSpreadsheet, Paperclip, ExternalLink } from "lucide-react";

interface Attachment {
  id: string;
  name: string;
  url: string;
  type?: string;
}

interface AttachmentsPanelProps {
  attachments: Attachment[];
}

function getFileIcon(name: string, type?: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const mime = type?.toLowerCase() ?? "";

  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext) || mime.startsWith("image/"))
    return Image;
  if (["pdf"].includes(ext) || mime === "application/pdf")
    return FileText;
  if (["xls", "xlsx", "csv"].includes(ext) || mime.includes("spreadsheet") || mime.includes("excel"))
    return FileSpreadsheet;
  if (["doc", "docx"].includes(ext) || mime.includes("word"))
    return FileText;
  return File;
}

function getFileLabel(name: string): string {
  // Strip UUID-style prefixes (e.g. "abc123_My Document.pdf" → "My Document.pdf")
  const cleaned = name.replace(/^[a-f0-9\-]{8,}_/i, "");
  // Trim excessive whitespace
  return cleaned.trim() || name;
}

function getExtBadge(name: string): string {
  return (name.split(".").pop() ?? "file").toUpperCase();
}

export function AttachmentsPanel({ attachments }: AttachmentsPanelProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Attachments ({attachments.length})
        </h3>
      </div>
      <ul className="divide-y divide-border">
        {attachments.map((att) => {
          const Icon = getFileIcon(att.name, att.type);
          const label = getFileLabel(att.name);
          const ext = getExtBadge(att.name);
          return (
            <li key={att.id}>
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40 group"
              >
                <Icon className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="flex-1 truncate text-sm text-card-foreground group-hover:text-foreground">
                  {label}
                </span>
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                  {ext}
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
