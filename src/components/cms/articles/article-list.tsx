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
} from "@nextui-org/react";
import { Plus, Search, FileText, Sparkles } from "lucide-react";
import type {
  Article,
  ReorderArticleDto,
} from "@/src/common/@types/@cms-article";
import ArticleTableRow from "./article-table-row";
import { ArticleDndProvider, ArticleSortableList } from "./article-reorder";

type ArticleStatus = "draft" | "published" | "archived";

interface ArticleListProps {
  blogId: number;
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
  onReorder: (reorderedArticles: ReorderArticleDto[]) => void;
}

/**
 * ArticleList Component
 *
 * Main component for displaying and managing articles with filtering and reordering.
 *
 * Features:
 * - Status filter tabs (All, Draft, Published, Archived)
 * - Article table with sortable columns
 * - Create new article button
 * - Drag-and-drop reordering integration
 * - Empty states for each filter
 * - Loading skeleton states
 * - Contextual actions per article
 *
 * Layout:
 * - Header with title and create button
 * - Status filter tabs
 * - Article table with drag handles
 * - Empty state when no articles match filter
 *
 * **Validates: Requirements 17.1, 17.2, 17.3, 17.5**
 */
export default function ArticleList({
  blogId,
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
  onReorder,
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

  // Sort by display_order
  const sortedArticles = [...filteredArticles].sort(
    (a, b) => a.display_order - b.display_order,
  );

  // Calculate counts for tabs
  const counts = {
    all: articles.length,
    draft: articles.filter((a) => a.status === "draft").length,
    published: articles.filter((a) => a.status === "published").length,
    archived: articles.filter((a) => a.status === "archived").length,
  };

  // Handle tab change
  const handleTabChange = (key: string | number) => {
    if (key === "all") {
      onStatusChange(undefined);
    } else {
      onStatusChange(key as ArticleStatus);
    }
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-12 w-full rounded-lg" />
        <Card>
          <CardBody>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Render empty state
  const renderEmptyState = () => {
    const emptyMessages = {
      all: {
        title: "No articles yet",
        desc: "Create your first article to get started",
      },
      draft: {
        title: "No draft articles",
        desc: "All your drafts will appear here",
      },
      published: {
        title: "No published articles",
        desc: "Published articles will appear here",
      },
      archived: {
        title: "No archived articles",
        desc: "Archived articles will appear here",
      },
    };

    const statusKey = currentStatus || "all";
    const message = emptyMessages[statusKey];

    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-default-100 flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-default-400" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No results found
          </h3>
          <p className="text-sm text-default-500 max-w-sm">
            No articles match "{searchQuery}". Try adjusting your search.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
          <FileText className="w-10 h-10 text-purple-500" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {message.title}
        </h3>
        <p className="text-sm text-default-500 mb-6 max-w-sm">{message.desc}</p>
        {statusKey === "all" && (
          <Button
            color="primary"
            size="lg"
            onPress={onCreateClick}
            startContent={<Sparkles size={18} />}
            className="font-semibold"
          >
            Create Your First Article
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              Articles
            </h1>
            <p className="text-default-500 mt-2">
              Manage your blog articles and content
            </p>
          </div>
          <Button
            color="primary"
            size="lg"
            onPress={onCreateClick}
            startContent={<Plus size={20} />}
            className="font-semibold"
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
              <span className="font-medium">All Articles</span>
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
      <Card className="border-none shadow-sm">
        <CardBody className="p-0">
          {sortedArticles.length === 0 ? (
            renderEmptyState()
          ) : (
            <ArticleDndProvider articles={sortedArticles} onReorder={onReorder}>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed min-w-[800px]">
                  <colgroup>
                    <col className="w-[48px]" />
                    <col />
                    <col className="w-[120px]" />
                    <col className="w-[130px]" />
                    <col className="w-[130px]" />
                    <col className="w-[120px]" />
                  </colgroup>
                  <thead className="bg-default-50 border-b border-divider">
                    <tr>
                      <th className="px-3 py-4 text-left text-xs font-semibold text-default-600 uppercase tracking-wider">
                        {/* Drag handle column */}
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-default-600 uppercase tracking-wider">
                        Article
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-default-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-default-600 uppercase tracking-wider">
                        Published
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-default-600 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-4 py-4 text-right text-xs font-semibold text-default-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    <ArticleSortableList articles={sortedArticles}>
                      {(article, isDragging) => (
                        <ArticleTableRow
                          key={article.id}
                          article={article}
                          onEdit={() => onEditClick(article)}
                          onDelete={() => onDeleteClick(article)}
                          onPublish={() => onPublishClick(article)}
                          onArchive={() => onArchiveClick(article)}
                          onPreview={
                            onPreviewClick
                              ? () => onPreviewClick(article)
                              : undefined
                          }
                          isDragging={isDragging}
                        />
                      )}
                    </ArticleSortableList>
                  </tbody>
                </table>
              </div>
            </ArticleDndProvider>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
