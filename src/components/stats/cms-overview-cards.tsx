"use client";

import Link from "next/link";
import { FileText, Users, BookOpen, FolderOpen, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { useListArticles } from "@/src/common/hooks/cms/use-list-articles";
import { useListBlogs } from "@/src/common/hooks/cms/use-list-blogs";
import { useGetAuthors } from "@/src/common/hooks/cms/use-get-authors";
import { useCollections } from "@/src/common/hooks/cms/use-collections";
import type { Article } from "@/src/common/@types/@cms-article";

interface OverviewKpiProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  href: string;
  isLoading?: boolean;
  accentClass: string;
}

function OverviewKpi({ label, value, sub, icon, href, isLoading, accentClass }: OverviewKpiProps) {
  return (
    <Link href={href} className="group block">
      <Card className="bg-card border-border transition-colors hover:border-gray-600 hover:bg-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className={`rounded-lg p-2 ${accentClass}`}>
              {icon}
            </div>
            <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-muted-foreground transition-colors mt-0.5 shrink-0" />
          </div>
          <div className="mt-3">
            {isLoading ? (
              <div className="h-7 w-16 rounded bg-[#1e1e35] animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{value}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            {sub && !isLoading && (
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function CmsOverviewCards() {
  const { data: articlesData, isLoading: articlesLoading } = useListArticles(undefined, 1, 200);
  const { data: blogsData, isLoading: blogsLoading } = useListBlogs(1, 100);
  const { data: authors, isLoading: authorsLoading } = useGetAuthors();
  const { data: collectionsData, isLoading: collectionsLoading } = useCollections({ page: 1, limit: 100 });

  const articles: Article[] = Array.isArray(articlesData)
    ? articlesData
    : ((articlesData as any)?.data ?? []);

  const publishedCount = articles.filter((a) => a.status === "published").length;
  const draftCount = articles.filter((a) => a.status === "draft").length;

  const blogs = Array.isArray(blogsData) ? blogsData : ((blogsData as any)?.data ?? blogsData ?? []);
  const blogCount = Array.isArray(blogs) ? blogs.length : 0;

  const authorCount = Array.isArray(authors) ? authors.length : 0;
  const collectionCount = collectionsData?.meta?.total ?? collectionsData?.data?.length ?? 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <OverviewKpi
        label="Articles"
        value={articles.length}
        sub={`${publishedCount} published · ${draftCount} draft`}
        icon={<FileText className="h-4 w-4 text-blue-400" />}
        href="/dashboard/cms/articles"
        isLoading={articlesLoading}
        accentClass="bg-blue-500/10"
      />
      <OverviewKpi
        label="Blogs"
        value={blogCount}
        icon={<BookOpen className="h-4 w-4 text-violet-400" />}
        href="/dashboard/cms/blogs"
        isLoading={blogsLoading}
        accentClass="bg-violet-500/10"
      />
      <OverviewKpi
        label="Authors"
        value={authorCount}
        icon={<Users className="h-4 w-4 text-emerald-400" />}
        href="/dashboard/cms/authors"
        isLoading={authorsLoading}
        accentClass="bg-emerald-500/10"
      />
      <OverviewKpi
        label="Collections"
        value={collectionCount}
        icon={<FolderOpen className="h-4 w-4 text-amber-400" />}
        href="/dashboard/cms/collections"
        isLoading={collectionsLoading}
        accentClass="bg-amber-500/10"
      />
    </div>
  );
}
