import { Heart, MessageCircle } from "lucide-react";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import type { InstagramMedia } from "@/src/shared/domain/types/@hotel-painel";

/**
 * O provider do backend nao devolve `permalink` — por isso os cards nao sao
 * links. Nao montar URL de post na mao a partir do id: o formato do permalink
 * do Instagram nao e derivavel do media id.
 *
 * `<img>` cru em vez de `next/image`: a URL vem do CDN da Meta, com host
 * rotativo e assinado, entao nao da para inscrever no `images.remotePatterns`.
 */
export function TopPosts({ posts }: { posts: InstagramMedia[] }) {
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
        <div
          key={post.id}
          className="block overflow-hidden rounded-lg border border-border"
        >
          <div className="relative aspect-square w-full bg-muted">
            {post.mediaUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.mediaUrl}
                alt={post.caption ?? "Post do Instagram"}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="flex items-center gap-3 p-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Heart className="size-3.5" />
              {post.likeCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-3.5" />
              {post.commentCount}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
