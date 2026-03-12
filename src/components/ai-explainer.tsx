"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles, X, BookOpen, FileText } from "lucide-react";

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
          className={`fixed ${zClass} w-80 rounded-xl border border-border bg-card shadow-xl`}
          style={{ left: pos?.x ?? 0, top: (pos?.y ?? 0) + 52, transform: "translateX(-50%)" }}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-mono font-medium text-muted-foreground tracking-wider uppercase">
                {mode === "explain" ? "Explanation" : "Simplified"}
              </span>
            </div>
            <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="px-4 py-3 min-h-[60px]">
            {loading && !response && (
              <div className="flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
              </div>
            )}
            <p className="text-sm text-card-foreground leading-relaxed">{response}</p>
          </div>
          <div className="border-t border-border px-4 py-2">
            <p className="text-xs font-mono text-muted-foreground/50 truncate">
              &ldquo;{selectedText.slice(0, 60)}{selectedText.length > 60 ? "…" : ""}&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
