"use client";

import { useMemo, useState } from "react";
import { Avatar, Chip } from "@heroui/react";
import { Edit, FileText, Plus } from "lucide-react";

import { EntityList } from "@/src/presentation/components/organisms/entity-list";
import type { EntityListDefinition } from "@/src/presentation/components/organisms/entity-list";
import {
  ARTICLE_LOCAL_ITEM_LIMIT,
  queryArticleEntityList,
  type ArticleEntityFilters,
} from "@/src/modules/cms/infrastructure/cms-article-entity-list-adapter";
import { CmsPageHeader } from "../shared/cms-page-header";
import ArticleStatusBadge from "./article-status-badge";
import type { Article } from "@/src/shared/domain/types/@cms-article";
import type { Author } from "@/src/shared/domain/types/@cms-author";
import { formatDate } from "@/src/shared/lib/utils";

interface ArticleListProps {
  blogId?: string;
  authors: Author[];
  onCreateClick: () => void;
  onRowClick: (article: Article) => void;
}

export default function ArticleList({
  blogId,
  authors,
  onCreateClick,
  onRowClick,
}: ArticleListProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const getAuthor = (authorId?: string) =>
    authorId ? authors.find((author) => String(author.id) === String(authorId)) : undefined;

  const definition = useMemo<EntityListDefinition<Article, ArticleEntityFilters>>(
    () => ({
      id: `cms-articles-${blogId ?? "all"}-${refreshKey}`,
      ariaLabel: "Artigos do blog",
      getKey: (article) => article.id,
      dataSource: {
        capabilities: {
          search: "local",
          sort: "local",
          pagination: "local",
          selection: "none",
          localItemLimit: ARTICLE_LOCAL_ITEM_LIMIT,
        },
        query: queryArticleEntityList(blogId),
      },
      initialState: { pageSize: 15, filters: { status: "" } },
      filters: [
        {
          key: "status",
          label: "Status",
          kind: "single",
          options: [
            { value: "draft", label: "Rascunho" },
            { value: "published", label: "Publicado" },
            { value: "archived", label: "Arquivado" },
          ],
        },
      ],
      sorts: [{ field: "updated_at", label: "Última atualização" }],
      variant: "table",
      columns: [
        {
          key: "title",
          header: "Artigo",
          render: (article) => (
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{article.displayTitle}</span>
              <span className="text-xs text-muted-foreground">{article.slug}</span>
            </div>
          ),
        },
        {
          key: "author",
          header: "Autor",
          render: (article) => {
            const author = getAuthor(article.authorId);
            return author ? (
              <div className="flex items-center gap-2">
                <Avatar size="sm" src={author.avatar_url} name={author.fullName} />
                <span className="text-sm text-foreground">{author.fullName}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            );
          },
        },
        {
          key: "language",
          header: "Idioma",
          render: (article) => (
            <Chip size="sm" variant="flat" color="default" className="uppercase">
              {article.language ?? "pt_br"}
            </Chip>
          ),
        },
        {
          key: "status",
          header: "Status",
          render: (article) => <ArticleStatusBadge status={article.status} />,
        },
        {
          key: "updated_at",
          header: "Última atualização",
          render: (article) => (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {formatDate(article.updated_at)}
            </span>
          ),
        },
        {
          key: "actions",
          header: "",
          align: "end",
          render: (article) => (
            <a
              aria-label="Editar artigo"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-default-100 hover:text-foreground"
              href={`/dashboard/cms/articles/${article.id}?blogId=${article.blog_id}`}
              onClick={(event) => event.stopPropagation()}
            >
              <Edit size={16} />
            </a>
          ),
        },
      ],
      onActivate: onRowClick,
      primaryActions: (
        <button
          type="button"
          className="btn-pill btn-primary inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm"
          onClick={onCreateClick}
        >
          <Plus className="h-4 w-4" />
          Novo artigo
        </button>
      ),
    }),
    [authors, blogId, onCreateClick, onRowClick, refreshKey],
  );

  // refreshKey is a manual-invalidation placeholder: each article mutation
  // (publish/archive/delete) that already exists in useArticleMutations should
  // eventually call setRefreshKey((key) => key + 1), or, preferably, invalidate
  // ["entity-list", "cms-articles"] directly through React Query (the prefix
  // optimistic.ts, Task 13, already matches this pattern). Wiring that up is
  // deferred to when the existing mutations are ported to entity-actions.

  return (
    <div className="space-y-6">
      <CmsPageHeader
        title="Artigos do blog"
        description="Escreva e publique conteúdo nas coleções do seu blog."
        icon={<FileText className="w-6 h-6" />}
      />
      <EntityList definition={definition} stateMode="memory" />
    </div>
  );
}
