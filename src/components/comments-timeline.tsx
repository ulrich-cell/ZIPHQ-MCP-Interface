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
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <h3 className="text-sm font-medium text-muted-foreground">AI Summary of Comments</h3>
          </div>
          <div className="px-5 py-5 space-y-3">
            {summary.split("\n").filter(Boolean).map((line, i) => (
              <p key={i} className="text-sm text-card-foreground leading-7">{line}</p>
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
