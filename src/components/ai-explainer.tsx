"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles, X, BookOpen, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface FloatingPos {
  x: number;
  y: number;
}

export function AiExplainer({
  children,
  zClass = "z-50",
}: {
  children: React.ReactNode;
  zClass?: string;
}) {
  const [selectedText, setSelectedText] = useState("");
  const [pos, setPos] = useState<FloatingPos | null>(null);
  const [mode, setMode] = useState<"explain" | "simplify" | null>(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    if (text.length < 5) {
      setPos(null);
      setSelectedText("");
      return;
    }
    const range = selection?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();
    if (!rect) return;
    setSelectedText(text);
    // Fixed positioning is relative to the viewport — no scroll offset needed
    setPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 48,
    });
    setMode(null);
    setResponse("");
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setPos(null);
      setMode(null);
      setResponse("");
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleMouseUp, handleKeyDown]);

  const run = async (m: "explain" | "simplify") => {
    setMode(m);
    setResponse("");
    setLoading(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText, mode: m }),
      });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResponse((prev) => prev + decoder.decode(value));
      }
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => {
    setPos(null);
    setMode(null);
    setResponse("");
    window.getSelection()?.removeAllRanges();
  };

  // Clamp panel so it doesn't go off the left or right edge
  const panelLeft = Math.max(240, Math.min(pos?.x ?? 0, window.innerWidth - 240));

  return (
    <div>
      {children}

      {/* Floating action buttons */}
      {pos && !mode && (
        <div
          className={`fixed ${zClass} flex items-center gap-1 rounded-lg border border-border bg-card shadow-lg px-1 py-1`}
          style={{ left: pos.x, top: pos.y, transform: "translateX(-50%)" }}
        >
          <button
            onClick={() => run("explain")}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Explain
          </button>
          <div className="w-px h-4 bg-border" />
          <button
            onClick={() => run("simplify")}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Simplify
          </button>
        </div>
      )}

      {/* Response panel */}
      {mode && (
        <div
          ref={panelRef}
          className={`fixed ${zClass} w-[480px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card shadow-2xl`}
          style={{ left: panelLeft, top: (pos?.y ?? 0) + 52, transform: "translateX(-50%)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/15">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <span className="text-sm font-semibold text-card-foreground">
                {mode === "explain" ? "Explanation" : "Plain English"}
              </span>
            </div>
            <button
              onClick={dismiss}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 min-h-[80px] max-h-[60vh] overflow-y-auto">
            {loading && !response && (
              <div className="flex gap-1.5 items-center py-2">
                <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
              </div>
            )}
            {response && (
              <div className="prose prose-sm prose-invert max-w-none
                [&>p]:text-sm [&>p]:text-card-foreground [&>p]:leading-7 [&>p]:mb-3 [&>p:last-child]:mb-0
                [&>ul]:text-sm [&>ul]:text-card-foreground [&>ul]:leading-7 [&>ul]:mb-3 [&>ul]:pl-4 [&>ul>li]:mb-1
                [&>ol]:text-sm [&>ol]:text-card-foreground [&>ol]:leading-7 [&>ol]:mb-3 [&>ol]:pl-4 [&>ol>li]:mb-1
                [&>strong]:text-card-foreground [&>strong]:font-semibold
                [&>h1]:text-base [&>h1]:font-semibold [&>h1]:mb-2
                [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:mb-2
                [&>h3]:text-sm [&>h3]:font-medium [&>h3]:mb-1.5
                [&>blockquote]:border-l-2 [&>blockquote]:border-purple-400/40 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-muted-foreground">
                <ReactMarkdown>{response}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Footer — source quote */}
          <div className="border-t border-border px-5 py-2.5">
            <p className="text-xs text-muted-foreground/40 truncate font-mono">
              &ldquo;{selectedText.slice(0, 80)}{selectedText.length > 80 ? "…" : ""}&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
