"use client";

import { useState } from "react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { FileText, Plus, Search, Loader2, MoreHorizontal, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { BlogSelector } from "@/src/components/cms/blog-selector";
import { useListArticles } from "@/src/common/hooks/cms/use-list-articles";
import { useDeleteArticle } from "@/src/common/hooks/cms/use-delete-article";
import { useHasSelectedTenant, useTenantStore } from "@/src/common/stores/tenant-store";

export default function ArticlesPage() {
  const [selectedBlogId, setSelectedBlogId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const hasSelectedTenant = useHasSelectedTenant();
  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  const { data: articlesData, isLoading } = useListArticles(
    selectedBlogId ? parseInt(selectedBlogId) : 0,
    1,
    50
  );
  const { mutate: deleteArticle, isPending: isDeleting } = useDeleteArticle(
    selectedBlogId ? parseInt(selectedBlogId) : 0
  );

  const handleDelete = (articleId: number, articleTitle: string) => {
    if (confirm(`Are you sure you want to delete "${articleTitle}"?`)) {
      deleteArticle(articleId);
    }
  };

  const filteredArticles = articlesData?.data?.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Show tenant selection warning
  if (!hasSelectedTenant) {
    return (
      <LayoutScopeRoot routeActive="articles">
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <Card className="bg-yellow-500/10 border-yellow-500/20 max-w-md">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-yellow-400 mb-2">
                  No Tenant Selected
                </h3>
                <p className="text-gray-400">
                  Please select a tenant from the sidebar to manage articles.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <LayoutScopeRoot routeActive="articles">
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-500" />
              Articles
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Managing articles for: <span className="text-purple-400 font-semibold">{selectedTenant?.name}</span>
            </p>
          </div>

          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={!selectedBlogId}
          >
            <Plus className="w-4 h-4 mr-2" />
            Write Article
          </Button>
        </div>

        <div className="flex items-center gap-4 bg-[#16162a] p-4 rounded-lg border border-gray-800">
          <div className="w-64">
            <BlogSelector
              value={selectedBlogId}
              onValueChange={setSelectedBlogId}
              placeholder="Select a blog"
            />
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search articles..."
              className="pl-9 bg-[#0f0f1a] border-gray-700 text-gray-200 placeholder:text-gray-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {!selectedBlogId ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Select a blog</h3>
            <p className="text-gray-500">Choose a blog to view and manage its articles</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : !filteredArticles || filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No articles yet</h3>
            <p className="text-gray-500 mb-6">Start writing your first article</p>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Write Article
            </Button>
          </div>
        ) : (
          <div className="rounded-md border border-gray-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-[#1a1a2e]">
                <TableRow className="border-gray-800 hover:bg-[#1a1a2e]">
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400 w-[40%]">Title</TableHead>
                  <TableHead className="text-gray-400">Slug</TableHead>
                  <TableHead className="text-gray-400">Published</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-[#12121f]">
                {filteredArticles?.map((article) => (
                  <TableRow
                    key={article.id}
                    className="border-gray-800 hover:bg-[#1e1e3a] transition-colors"
                  >
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          article.status === "published"
                            ? "bg-green-500/10 text-green-400"
                            : article.status === "draft"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {article.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-gray-200">
                      {article.title}
                    </TableCell>
                    <TableCell className="text-gray-400 font-mono text-xs">
                      /{article.slug}
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/cms/articles/${article.id}?blogId=${selectedBlogId}`}
                            >
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400"
                            onClick={() => handleDelete(article.id, article.title)}
                            disabled={isDeleting}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </LayoutScopeRoot>
  );
}
