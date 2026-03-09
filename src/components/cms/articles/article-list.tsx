"use client";

import { useState, useMemo } from "react";
import {
  Button,
  Tabs,
  Tab,
  Skeleton,
  Chip,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
} from "@heroui/react";
import {
  Plus,
  Search,
  FileText,
  Sparkles,
  Edit,
} from "lucide-react";
import type { Article } from "@/src/common/@types/@cms-article";
import type { Author } from "@/src/common/@types/@cms-author";
import ArticleStatusBadge from "./article-status-badge";

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

  // Helper to get author name by ID
  const getAuthorName = (authorId?: string) => {
    if (!authorId) return "—";
    const author = authors.find((a) => String(a.id) === String(authorId));
    
    // Debug temporário
    if (!author && authorId) {
      console.log('Author not found:', {
        authorId,
        availableAuthors: authors.map(a => ({ id: a.id, name: a.firstName }))
      });
    }
    
    return author ? author.firstName : "—";
  };

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

  // Reset page when filters change
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

  const renderCell = (article: Article, columnKey: string) => {
    switch (columnKey) {
      case "title":
        return (
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-semibold text-foreground truncate">
              {article.displayTitle || article.title}
            </span>
            <span className="text-xs text-default-400 font-mono truncate">
              /{article.slug}
            </span>
          </div>
        );
      case "author":
        return (
          <span className="text-sm text-default-600">
            {getAuthorName(article.authorId)}
          </span>
        );
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
          <span className="text-sm text-default-600 whitespace-nowrap">
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
                // Navigate to edit page instead of opening dropdown
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Articles
            </h1>
            <p className="text-sm text-default-500 mt-1">
              {articles.length > 0
                ? `${articles.length} article${articles.length !== 1 ? "s" : ""}`
                : "Manage your blog articles and content"}
            </p>
          </div>
          <Button
            color="primary"
            size="sm"
            onPress={onCreateClick}
            startContent={<Plus size={18} />}
          >
            New Article
          </Button>
        </div>

        {/* Search Bar */}
        <Input
          placeholder="Search articles by title or slug..."
          value={searchQuery}
          onValueChange={handleSearch}
          startContent={<Search className="w-4 h-4 text-default-400" />}
          isClearable
          onClear={() => handleSearch("")}
          size="sm"
          classNames={{
            base: "max-w-md",
            inputWrapper: "bg-default-100 data-[hover=true]:bg-default-200",
          }}
        />
      </div>

      {/* Status Filter Tabs */}
      <Tabs
        aria-label="Article status filter"
        selectedKey={currentStatus || "all"}
        onSelectionChange={handleTabChange}
        variant="underlined"
        color="primary"
        classNames={{
          tabList: "gap-4 sm:gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary",
        }}
      >
        <Tab
          key="all"
          title={
            <div className="flex items-center gap-1.5">
              <span className="font-medium">All</span>
              <Chip size="sm" variant="flat" color="default">{counts.all}</Chip>
            </div>
          }
        />
        <Tab
          key="draft"
          title={
            <div className="flex items-center gap-1.5">
              <span className="font-medium">Drafts</span>
              <Chip size="sm" variant="flat" color="warning">{counts.draft}</Chip>
            </div>
          }
        />
        <Tab
          key="published"
          title={
            <div className="flex items-center gap-1.5">
              <span className="font-medium">Published</span>
              <Chip size="sm" variant="flat" color="success">{counts.published}</Chip>
            </div>
          }
        />
        <Tab
          key="archived"
          title={
            <div className="flex items-center gap-1.5">
              <span className="font-medium">Archived</span>
              <Chip size="sm" variant="flat" color="default">{counts.archived}</Chip>
            </div>
          }
        />
      </Tabs>

      {/* Articles Table */}
      <Table
        aria-label="Articles table"
        classNames={{
          wrapper: "rounded-xl border border-divider",
          th: "bg-default-100 text-xs font-semibold uppercase tracking-wider",
          tr: "cursor-pointer hover:bg-default-50 transition-colors",
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
                <Search className="w-10 h-10 text-default-300 mx-auto mb-3" />
                <p className="text-default-500">
                  No articles match &quot;{searchQuery}&quot;
                </p>
              </div>
            ) : (
              <div className="py-12 text-center">
                <FileText className="w-10 h-10 text-default-300 mx-auto mb-3" />
                <p className="font-medium text-foreground mb-1">No articles yet</p>
                <p className="text-sm text-default-500 mb-4">
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

      {/* Pagination */}
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
