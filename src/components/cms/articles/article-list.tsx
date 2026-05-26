"use client";

import { useState, useMemo } from "react";
import {
  Avatar,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Skeleton,
  Chip,
  Card,
  Pagination,
} from "@heroui/react";
import {
  Search,
  FileText,
  Sparkles,
  Edit,
  Plus,
} from "lucide-react";
import type { Article } from "@/src/common/@types/@cms-article";
import type { Author } from "@/src/common/@types/@cms-author";
import ArticleStatusBadge from "./article-status-badge";
import { CmsPageHeader, CmsTabItem } from "../shared/cms-page-header";

type ArticleStatus = "draft" | "published" | "archived";

interface ArticleListProps {
  blogId?: number;
  articles: Article[];
  authors: Author[];
  isLoading: boolean;
  currentStatus?: ArticleStatus;
  onStatusChange: (status?: ArticleStatus) => void;
  onCreateClick: () => void;
  onRowClick: (article: Article) => void;
}

const COLUMNS = [
  { key: "title", label: "Article" },
  { key: "author", label: "Author" },
  { key: "language", label: "Language" },
  { key: "status", label: "Status" },
  { key: "updated_at", label: "Last Updated" },
  { key: "actions", label: "" },
];

const PAGE_SIZE = 15;

export default function ArticleList({
  articles,
  authors,
  isLoading,
  currentStatus,
  onStatusChange,
  onCreateClick,
  onRowClick,
}: ArticleListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const getAuthor = (authorId?: string) =>
    authorId ? authors.find((a) => String(a.id) === String(authorId)) : undefined;

  const filteredArticles = useMemo(() => {
    const filtered = articles.filter((article) => {
      const matchesStatus = currentStatus ? article.status === currentStatus : true;
      const matchesSearch = searchQuery
        ? article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.slug.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesStatus && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      const leftDate = new Date(a.published_at ?? a.updated_at).getTime();
      const rightDate = new Date(b.published_at ?? b.updated_at).getTime();
      return rightDate - leftDate;
    });
  }, [articles, currentStatus, searchQuery]);

  const totalPages = Math.ceil(filteredArticles.length / PAGE_SIZE);
  const pagedArticles = filteredArticles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTabChange = (key: string | number) => {
    setPage(1);
    if (key === "all") {
      onStatusChange(undefined);
    } else {
      onStatusChange(key as ArticleStatus);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const counts = {
    all: articles.length,
    draft: articles.filter((a) => a.status === "draft").length,
    published: articles.filter((a) => a.status === "published").length,
    archived: articles.filter((a) => a.status === "archived").length,
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const tabs: CmsTabItem[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "draft", label: "Drafts", count: counts.draft, color: "warning" },
    { id: "published", label: "Published", count: counts.published, color: "success" },
    { id: "archived", label: "Archived", count: counts.archived, color: "default" },
  ];

  const renderCell = (article: Article, columnKey: string) => {
    switch (columnKey) {
      case "title":
        return (
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-semibold text-foreground truncate">
              {article.displayTitle || article.title}
            </span>
            <span className="text-xs text-muted-foreground font-mono truncate">
              /{article.slug}
            </span>
          </div>
        );
      case "author": {
        const author = getAuthor(article.authorId);
        return author ? (
          <div className="flex items-center gap-2">
            <Avatar
              src={author.avatar_url ?? author.avatar?.url ?? undefined}
              name={`${author.firstName} ${author.lastName}`}
              size="sm"
              className="w-6 h-6 text-[10px] shrink-0"
            />
            <span className="text-sm text-muted-foreground truncate">
              {author.firstName} {author.lastName}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );
      }
      case "language":
        return (
          <Chip size="sm" variant="flat" color="default" className="uppercase">
            {article.language ?? "en_us"}
          </Chip>
        );
      case "status":
        return <ArticleStatusBadge status={article.status} />;
      case "updated_at":
        return (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(article.updated_at)}
          </span>
        );
      case "actions": {
        return (
          <div
            className="flex items-center justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              isIconOnly
              size="sm"
              variant="light"
              aria-label="Edit article"
              onPress={() => {
                window.location.href = `/dashboard/cms/articles/${article.id}?blogId=${article.blog_id}`;
              }}
            >
              <Edit size={16} />
            </Button>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <CmsPageHeader
        title="Blog Articles"
        description="Write and publish content across your blog collections."
        icon={<FileText className="w-6 h-6" />}
        actionLabel="New Article"
        actionIcon={<Plus size={18} />}
        onActionClick={onCreateClick}
        searchValue={searchQuery}
        onSearchChange={handleSearch}
        searchPlaceholder="Search articles by title or slug..."
        tabs={tabs}
        activeTab={currentStatus || "all"}
        onTabChange={handleTabChange}
      />

      <Card className="shadow-sm border-none overflow-hidden">
        <Table
          aria-label="Articles table"
          removeWrapper
          classNames={{
            th: "bg-default-50 text-xs font-semibold uppercase tracking-wider py-4",
            tr: "cursor-pointer hover:bg-default-50 transition-colors",
            td: "py-4",
          }}
        >
          <TableHeader columns={COLUMNS}>
            {(col) => (
              <TableColumn
                key={col.key}
                align={col.key === "actions" ? "end" : "start"}
                className={
                  col.key === "updated_at" || col.key === "author" || col.key === "language"
                    ? "hidden md:table-cell"
                    : undefined
                }
              >
                {col.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={pagedArticles}
            isLoading={isLoading}
            loadingContent={
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            }
            emptyContent={
              searchQuery ? (
                <div className="py-12 text-center">
                  <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground">
                    No articles match &quot;{searchQuery}&quot;
                  </p>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-foreground mb-1">No articles yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first article to get started
                  </p>
                  <Button
                    color="primary"
                    size="sm"
                    onPress={onCreateClick}
                    startContent={<Sparkles size={16} />}
                  >
                    Create Article
                  </Button>
                </div>
              )
            }
          >
            {(article) => (
              <TableRow key={article.id} onClick={() => onRowClick(article)}>
                {(col) => (
                  <TableCell
                    className={
                      col === "updated_at" || col === "author" || col === "language"
                        ? "hidden md:table-cell"
                        : undefined
                    }
                  >
                    {renderCell(article, col as string)}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination
            total={totalPages}
            page={page}
            onChange={setPage}
            showControls
            color="primary"
            variant="flat"
          />
        </div>
      )}
    </div>
  );
}
