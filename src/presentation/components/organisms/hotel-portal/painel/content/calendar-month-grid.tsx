import type { ContentPost } from "@/src/shared/domain/types/@hotel-painel";

const statusColor: Record<ContentPost["status"], string> = {
  draft: "bg-muted",
  scheduled: "bg-amber-100",
  published: "bg-emerald-100",
};

/**
 * `scheduled_for` e `published_at` sao ambos nullable no banco, e o backend
 * traz o post se QUALQUER um dos dois cair no mes. Por isso a data efetiva do
 * card e "agendado, senao publicado" — sem isso, post ja publicado sem
 * agendamento sumiria do grid.
 */
export function postDate(post: ContentPost): string | null {
  return post.scheduled_for ?? post.published_at;
}

/** Grid mensal (desktop). No mobile quem renderiza e `<CalendarWeekList>`. */
export function CalendarMonthGrid({
  posts,
  month,
}: {
  posts: ContentPost[];
  month: string;
}) {
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  const postsByDay = new Map<number, ContentPost[]>();
  posts.forEach((post) => {
    const iso = postDate(post);
    if (!iso) return;
    const day = new Date(iso).getUTCDate();
    postsByDay.set(day, [...(postsByDay.get(day) ?? []), post]);
  });

  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
        <div
          key={day}
          className="min-h-20 rounded border border-border p-1 text-xs"
        >
          <span className="text-muted-foreground">{day}</span>
          {(postsByDay.get(day) ?? []).map((post) => (
            <div
              key={post.id}
              className={`mt-1 truncate rounded px-1 ${statusColor[post.status]}`}
              title={post.caption_preview ?? undefined}
            >
              {post.caption_preview ?? "(sem legenda)"}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
