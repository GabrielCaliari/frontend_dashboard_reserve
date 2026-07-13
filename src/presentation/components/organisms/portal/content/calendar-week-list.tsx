import Link from "next/link";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import type { ContentPost } from "@/src/modules/portal/domain/portal-content";

const statusLabel: Record<ContentPost["status"], string> = {
  draft: "Em produção",
  scheduled: "Agendado",
  published: "Publicado",
};

function weekOfMonth(dateIso: string): number {
  const date = new Date(dateIso);
  return Math.ceil(date.getDate() / 7);
}

/** Mobile view (master doc §3.5 "Visão mensal (mobile: lista por semana)"). */
export function CalendarWeekList({ posts }: { posts: ContentPost[] }) {
  const byWeek = new Map<number, ContentPost[]>();
  posts.forEach((post) => {
    const week = weekOfMonth(post.scheduled_for);
    byWeek.set(week, [...(byWeek.get(week) ?? []), post]);
  });

  return (
    <div className="space-y-4">
      {Array.from(byWeek.entries()).map(([week, weekPosts]) => (
        <div key={week}>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Semana {week}</p>
          <div className="space-y-2">
            {weekPosts.map((post) => {
              const content = (
                <Card className="flex items-center justify-between p-3">
                  <span className="text-sm">{post.caption_preview}</span>
                  <span className="text-xs text-muted-foreground">{statusLabel[post.status]}</span>
                </Card>
              );
              return post.permalink ? (
                <Link key={post.id} href={post.permalink} target="_blank" rel="noreferrer">
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
