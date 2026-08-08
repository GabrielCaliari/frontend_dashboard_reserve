import Link from "next/link";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import type { ContentPost } from "@/src/shared/domain/types/@hotel-painel";
import { postDate } from "./calendar-month-grid";

const statusLabel: Record<ContentPost["status"], string> = {
  draft: "Em produção",
  scheduled: "Agendado",
  published: "Publicado",
};

function weekOfMonth(dateIso: string): number {
  return Math.ceil(new Date(dateIso).getUTCDate() / 7);
}

/** Visao mobile (§3.5 "Visao mensal (mobile: lista por semana)"). */
export function CalendarWeekList({ posts }: { posts: ContentPost[] }) {
  const byWeek = new Map<number, ContentPost[]>();
  posts.forEach((post) => {
    const iso = postDate(post);
    if (!iso) return;
    const week = weekOfMonth(iso);
    byWeek.set(week, [...(byWeek.get(week) ?? []), post]);
  });

  return (
    <div className="space-y-4">
      {[...byWeek.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([week, weekPosts]) => (
          <div key={week}>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Semana {week}
            </p>
            <div className="space-y-2">
              {weekPosts.map((post) => {
                const content = (
                  <Card className="flex items-center justify-between gap-2 p-3">
                    <span className="text-sm">
                      {post.caption_preview ?? "(sem legenda)"}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {statusLabel[post.status]}
                    </span>
                  </Card>
                );
                return post.permalink ? (
                  <Link
                    key={post.id}
                    href={post.permalink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={post.id}>{content}</div>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
