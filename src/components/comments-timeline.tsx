import { MessageSquare, Sparkles } from "lucide-react";
import type { ZipComment } from "@/lib/zip-api";
import { formatEpochLong } from "@/lib/zip-api";

interface CommentsTimelineProps {
  comments: ZipComment[];
  summary?: string | null;
}

export function CommentsTimeline({ comments, summary }: CommentsTimelineProps) {
  if (comments.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <span>No comments yet.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {summary && (
        <div className="rounded-xl border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-card shadow-sm">
          <div className="flex items-center gap-2.5 px-6 pt-5 pb-4">
            <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
            <h3 className="text-sm font-semibold text-purple-300/80 tracking-wide">AI Summary of Comments</h3>
          </div>
          <div className="px-6 pb-6">
            <div className="h-px bg-purple-500/10 mb-5" />
            {summary
              .replace(/^#+\s*/gm, "")
              .split("\n")
              .filter(Boolean)
              .map((line, i) => (
                <p key={i} className="text-sm text-card-foreground/90 leading-8 tracking-wide">
                  {line}
                </p>
              ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Comments ({comments.length})
          </h3>
        </div>
        <div className="divide-y divide-border">
          {comments.map((comment) => {
            const name = comment.commenter
              ? `${comment.commenter.first_name} ${comment.commenter.last_name}`
              : "Unknown";
            return (
              <div key={comment.id} className="px-5 py-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-card-foreground">{name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatEpochLong(comment.created_at)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {comment.text || ""}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
