import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { PortalEmptyState } from "@/src/presentation/components/organisms/portal/empty-state";
import type { InstagramPost } from "@/src/modules/portal/domain/portal-instagram";

export function TopPosts({ posts }: { posts: InstagramPost[] }) {
  if (posts.length === 0) {
    return (
      <PortalEmptyState
        title="Nenhum post no período"
        description="Assim que houver publicações no Instagram nessas datas, os 3 mais engajados aparecem aqui."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {posts.slice(0, 3).map((post) => (
        <Link
          key={post.id}
          href={post.permalink}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-lg border border-border"
        >
          <div className="relative aspect-square w-full">
            <Image src={post.media_url} alt={post.caption ?? "Post do Instagram"} fill className="object-cover" />
          </div>
          <div className="flex items-center gap-3 p-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Heart className="size-3.5" />
              {post.like_count}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-3.5" />
              {post.comments_count}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
