import type { ContentPost } from "@/src/modules/portal/domain/portal-content";

const statusColor: Record<ContentPost["status"], string> = {
  draft: "bg-muted",
  scheduled: "bg-amber-100",
  published: "bg-emerald-100",
};

/** Desktop-only month grid (mobile uses `<CalendarWeekList>` instead). */
export function CalendarMonthGrid({ posts, month }: { posts: ContentPost[]; month: string }) {
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const postsByDay = new Map<number, ContentPost[]>();
  posts.forEach((post) => {
    const day = new Date(post.scheduled_for).getDate();
    postsByDay.set(day, [...(postsByDay.get(day) ?? []), post]);
  });

  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
        <div key={day} className="min-h-20 rounded border border-border p-1 text-xs">
          <span className="text-muted-foreground">{day}</span>
          {(postsByDay.get(day) ?? []).map((post) => (
            <div key={post.id} className={`mt-1 truncate rounded px-1 ${statusColor[post.status]}`}>
              {post.caption_preview}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
