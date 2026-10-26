import { Heart, ImageOff, MessageCircle } from "lucide-react";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import type { InstagramMedia } from "@/src/shared/domain/types/@hotel-painel";

const inteiro = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

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
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {posts.slice(0, 3).map((post, i) => (
        <li
          key={post.id}
          className="overflow-hidden rounded-2xl border border-border/80 bg-default-50"
        >
          <div className="relative aspect-square w-full bg-default-100">
            {post.mediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.mediaUrl}
                alt={post.caption ?? "Post do Instagram"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                <ImageOff aria-hidden className="h-8 w-8" />
              </div>
            )}
            {/* O 1º, 2º e 3º: o ranking e a informacao desta secao. */}
            <span className="absolute left-3 top-3 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-background/90 px-2 font-display text-sm font-semibold text-foreground">
              {i + 1}º
            </span>
          </div>
          <div className="space-y-2 p-4">
            {post.caption && (
              <p className="line-clamp-2 text-sm text-foreground/85">{post.caption}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Heart aria-hidden className="size-4" />
                {inteiro(post.likeCount)}
                <span className="sr-only">curtidas</span>
              </span>
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <MessageCircle aria-hidden className="size-4" />
                {inteiro(post.commentCount)}
                <span className="sr-only">comentários</span>
              </span>
              <span className="ml-auto text-xs">
                {new Date(post.timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
