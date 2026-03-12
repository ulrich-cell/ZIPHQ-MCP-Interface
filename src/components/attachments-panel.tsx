"use client";

import { useState } from "react";
import { FileText, Image, File, FileSpreadsheet, ChevronDown, ShieldAlert, ExternalLink, Lock } from "lucide-react";

interface Attachment {
  id: string;
  name: string;
  url: string;
  type?: string;
}

interface AttachmentsPanelProps {
  attachments: Attachment[];
}

const RISKY_EXTENSIONS = new Set(["exe", "bat", "sh", "ps1", "cmd", "msi", "dmg", "pkg", "zip", "rar"]);

function getFileIcon(name: string, type?: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const mime = (type ?? "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext) || mime.startsWith("image/")) return Image;
  if (ext === "pdf" || mime === "application/pdf") return FileText;
  if (["xls", "xlsx", "csv"].includes(ext) || mime.includes("spreadsheet") || mime.includes("excel")) return FileSpreadsheet;
  if (["doc", "docx"].includes(ext) || mime.includes("word")) return FileText;
  return File;
}

function sanitizeName(name: string): string {
  // Strip UUID-style prefixes, strip HTML chars
  return name
    .replace(/^[a-f0-9\-]{8,}_/i, "")
    .replace(/[<>"']/g, "")
    .trim() || name;
}

function getExt(name: string): string {
  return (name.split(".").pop() ?? "file").toLowerCase();
}

function isRisky(ext: string): boolean {
  return RISKY_EXTENSIONS.has(ext);
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function AttachmentsPanel({ attachments }: AttachmentsPanelProps) {
  const [open, setOpen] = useState(false);

  if (attachments.length === 0) return null;

  const safeAttachments = attachments.filter((a) => isSafeUrl(a.url));
  const blockedCount = attachments.length - safeAttachments.length;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header — always visible, click to expand */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <Lock className="h-3.5 w-3.5 text-yellow-500/60" />
          <span className="text-xs font-mono font-medium tracking-widest uppercase text-muted-foreground/70">
            Attachments
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
            {attachments.length}
          </span>
          {blockedCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-mono text-red-400">
              <ShieldAlert className="h-3 w-3" />
              {blockedCount} blocked
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expandable content */}
      {open && (
        <div className="border-t border-border">
          {/* Zero-trust notice */}
          <div className="flex items-center gap-2 border-b border-border/50 bg-sky-500/5 px-5 py-2">
            <ShieldAlert className="h-3 w-3 shrink-0 text-sky-400/60" />
            <p className="text-xs font-mono text-sky-400/60 tracking-wide">
              verify before opening · external links · handle with care
            </p>
          </div>

          <ul className="py-1">
            {safeAttachments.map((att) => {
              const Icon = getFileIcon(att.name, att.type);
              const label = sanitizeName(att.name);
              const ext = getExt(att.name);
              const risky = isRisky(ext);
              // Strip extension from label if it already ends with it
              const displayName = label.toLowerCase().endsWith(`.${ext}`)
                ? label.slice(0, -(ext.length + 1))
                : label;

              return (
                <li key={att.id}>
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-3 px-5 py-1.5 hover:bg-muted/20 transition-colors group/item"
                  >
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${risky ? "text-red-400/60" : "text-yellow-400/70 group-hover/item:text-yellow-300"} transition-colors`} />

                    <span className={`flex-1 truncate text-xs font-mono tracking-tight ${risky ? "text-red-300/70" : "text-yellow-300/70 group-hover/item:text-yellow-200"} transition-colors`}>
                      {displayName}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {risky && (
                        <span className="flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-mono text-red-400/70">
                          <ShieldAlert className="h-2.5 w-2.5" />
                          caution
                        </span>
                      )}
                      <span className={`rounded px-1.5 py-0.5 text-xs font-mono tracking-wider ${risky ? "bg-red-500/10 text-red-400/60" : "bg-yellow-400/10 text-yellow-400/70"}`}>
                        {ext.toUpperCase()}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground/30 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
