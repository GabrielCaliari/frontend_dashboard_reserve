"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  Plus,
  Search,
  FileText,
  Sparkles,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Archive,
  Send,
} from "lucide-react";
import type {
  Article,
} from "@/src/common/@types/@cms-article";
import ArticleStatusBadge from "./article-status-badge";

type ArticleStatus = "draft" | "published" | "archived";

interface ArticleListProps {
  blogId?: number;
  articles: Article[];
  isLoading: boolean;
  currentStatus?: ArticleStatus;
  onStatusChange: (status?: ArticleStatus) => void;
  onCreateClick: () => void;
  onEditClick: (article: Article) => void;
  onDeleteClick: (article: Article) => void;
  onPublishClick: (article: Article) => void;
  onArchiveClick: (article: Article) => void;
  onPreviewClick?: (article: Article) => void;
}

const COLUMNS = [
  { key: "title", label: "Article" },
  { key: "status", label: "Status" },
  { key: "language", label: "Language" },
  { key: "published_at", label: "Published" },
  { key: "updated_at", label: "Last Updated" },
  { key: "actions", label: "Actions" },
];

export default function ArticleList({
  articles,
  isLoading,
  currentStatus,
  onStatusChange,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  onPublishClick,
  onArchiveClick,
  onPreviewClick,
}: ArticleListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter articles by status and search
  const filteredArticles = articles.filter((article) => {
    const matchesStatus = currentStatus
      ? article.status === currentStatus
      : true;
    const matchesSearch = searchQuery
      ? article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.slug.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  const sortedArticles = [...filteredArticles].sort(
    (a, b) => {
      const leftDate = new Date(a.published_at ?? a.updated_at).getTime();
      const rightDate = new Date(b.published_at ?? b.updated_at).getTime();
      return rightDate - leftDate;
    },
  );

  // Calculate counts for tabs
  const counts = {
    all: articles.length,
    draft: articles.filter((a) => a.status === "draft").length,
    published: articles.filter((a) => a.status === "published").length,
    archived: articles.filter((a) => a.status === "archived").length,
  };

  const handleTabChange = (key: string | number) => {
    if (key === "all") {
      onStatusChange(undefined);
    } else {
      onStatusChange(key as ArticleStatus);
    }
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
      case "status":
        return <ArticleStatusBadge status={article.status} />;
      case "language":
        return (
          <Chip size="sm" variant="flat" color="default" className="uppercase">
            {article.language ?? 'en_us'}
          </Chip>
        );
      case "published_at":
        return (
          <span className="text-sm text-default-600 whitespace-nowrap">
            {formatDate(article.published_at)}
          </span>
        );
      case "updated_at":
        return (
          <span className="text-sm text-default-600 whitespace-nowrap">
            {formatDate(article.updated_at)}
          </span>
        );
      case "actions": {
        const canPublish = article.status === "draft";
        const canArchive = article.status === "published";
        const canDelete =
          article.status === "draft" || article.status === "archived";

        return (
          <div className="flex items-center gap-1 justify-end">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => onEditClick(article)}
              aria-label="Edit article"
            >
              <Edit size={16} />
            </Button>

            {onPreviewClick && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onPreviewClick(article)}
                aria-label="Preview article"
              >
                <Eye size={16} />
              </Button>
            )}

            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  aria-label="More actions"
                >
                  <MoreVertical size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Article actions">
                {canPublish ? (
                  <DropdownItem
                    key="publish"
                    startContent={<Send size={16} />}
                    onPress={() => onPublishClick(article)}
                    color="success"
                    className="text-success"
                  >
                    Publish Article
                  </DropdownItem>
                ) : null}
                {canArchive ? (
                  <DropdownItem
                    key="archive"
                    startContent={<Archive size={16} />}
                    onPress={() => onArchiveClick(article)}
                    color="warning"
                    className="text-warning"
                  >
                    Archive Article
                  </DropdownItem>
                ) : null}
                {canDelete ? (
                  <DropdownItem
                    key="delete"
                    startContent={<Trash2 size={16} />}
                    onPress={() => onDeleteClick(article)}
                    color="danger"
                    className="text-danger"
                  >
                    Delete Article
                  </DropdownItem>
                ) : null}
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
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
          onValueChange={setSearchQuery}
          startContent={<Search className="w-4 h-4 text-default-400" />}
          isClearable
          onClear={() => setSearchQuery("")}
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
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary",
        }}
      >
        <Tab
          key="all"
          title={
            <div className="flex items-center gap-2">
              <span className="font-medium">All</span>
              <Chip size="sm" variant="flat" color="default">
                {counts.all}
              </Chip>
            </div>
          }
        />
        <Tab
          key="draft"
          title={
            <div className="flex items-center gap-2">
              <span className="font-medium">Drafts</span>
              <Chip size="sm" variant="flat" color="warning">
                {counts.draft}
              </Chip>
            </div>
          }
        />
        <Tab
          key="published"
          title={
            <div className="flex items-center gap-2">
              <span className="font-medium">Published</span>
              <Chip size="sm" variant="flat" color="success">
                {counts.published}
              </Chip>
            </div>
          }
        />
        <Tab
          key="archived"
          title={
            <div className="flex items-center gap-2">
              <span className="font-medium">Archived</span>
              <Chip size="sm" variant="flat" color="default">
                {counts.archived}
              </Chip>
            </div>
          }
        />
      </Tabs>

      {/* Articles Table */}
      <div className="overflow-x-auto w-full">
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
              >
                {col.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={sortedArticles}
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
                  <p className="font-medium text-foreground mb-1">
                    No articles yet
                  </p>
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
              <TableRow
                key={article.id}
                onClick={() => onEditClick(article)}
              >
                {(col) => (
                  <TableCell>{renderCell(article, col as string)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
