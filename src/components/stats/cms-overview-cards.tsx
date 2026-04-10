"use client";

import Link from "next/link";
import {
  FileText,
  Users,
  BookOpen,
  FolderOpen,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { useListArticles } from "@/src/common/hooks/cms/use-list-articles";
import { useListBlogs } from "@/src/common/hooks/cms/use-list-blogs";
import { useGetAuthors } from "@/src/common/hooks/cms/use-get-authors";
import { useCollections } from "@/src/common/hooks/cms/use-collections";
import type { Article } from "@/src/shared/domain/types/@cms-article";

interface OverviewKpiProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  href: string;
  isLoading?: boolean;
  accentClass: string;
}

function OverviewKpi({
  label,
  value,
  sub,
  icon,
  href,
  isLoading,
  accentClass,
}: OverviewKpiProps) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="h-full bg-default-50 border-border transition-all duration-300 hover:border-primary/30 hover:bg-default-100 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
        <CardContent className="p-5 sm:p-6 flex flex-col h-full justify-between">
          <div className="flex items-start justify-between gap-3">
            <div
              className={`rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110 ${accentClass}`}
            >
              {icon}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 mt-1" />
          </div>
          <div className="mt-4 sm:mt-6">
            {isLoading ? (
              <div className="h-8 w-20 rounded-md bg-default-200 animate-pulse mb-1" />
            ) : (
              <p className="text-3xl font-bold text-foreground tracking-tight">
                {value}
              </p>
            )}
            <p className="text-sm font-medium text-muted-foreground mt-1">
              {label}
            </p>
            {sub && !isLoading && (
              <p className="text-xs text-muted-foreground/80 mt-1.5">{sub}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function CmsOverviewCards() {
  const { data: articlesData, isLoading: articlesLoading } = useListArticles(
    undefined,
    1,
    200,
  );
  const { data: blogsData, isLoading: blogsLoading } = useListBlogs(1, 100);
  const { data: authors, isLoading: authorsLoading } = useGetAuthors();
  const { data: collectionsData, isLoading: collectionsLoading } =
    useCollections({ page: 1, limit: 100 });

  const articles: Article[] = Array.isArray(articlesData)
    ? articlesData
    : ((articlesData as any)?.data ?? []);

  const publishedCount = articles.filter(
    (a) => a.status === "published",
  ).length;
  const draftCount = articles.filter((a) => a.status === "draft").length;

  const blogs = Array.isArray(blogsData)
    ? blogsData
    : ((blogsData as any)?.data ?? blogsData ?? []);
  const blogCount = Array.isArray(blogs) ? blogs.length : 0;

  const authorCount = Array.isArray(authors) ? authors.length : 0;
  const collectionCount =
    collectionsData?.meta?.total ?? collectionsData?.data?.length ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <OverviewKpi
        label="Blog Articles"
        value={articles.length}
        sub={`${publishedCount} published · ${draftCount} draft`}
        icon={<FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />}
        href="/dashboard/cms/articles"
        isLoading={articlesLoading}
        accentClass="bg-blue-500/10 dark:bg-blue-500/20"
      />
      <OverviewKpi
        label="Blog Collections"
        value={blogCount}
        icon={
          <BookOpen className="h-5 w-5 text-violet-500 dark:text-violet-400" />
        }
        href="/dashboard/cms/blogs"
        isLoading={blogsLoading}
        accentClass="bg-violet-500/10 dark:bg-violet-500/20"
      />
      <OverviewKpi
        label="Blog Authors"
        value={authorCount}
        icon={
          <Users className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
        }
        href="/dashboard/cms/authors"
        isLoading={authorsLoading}
        accentClass="bg-emerald-500/10 dark:bg-emerald-500/20"
      />
      <OverviewKpi
        label="Lead Collections"
        value={collectionCount}
        icon={
          <FolderOpen className="h-5 w-5 text-amber-500 dark:text-amber-400" />
        }
        href="/dashboard/cms/collections"
        isLoading={collectionsLoading}
        accentClass="bg-amber-500/10 dark:bg-amber-500/20"
      />
    </div>
  );
}
