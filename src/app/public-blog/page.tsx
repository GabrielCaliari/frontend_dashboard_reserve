"use client";

import { useState } from "react";
import { useListPublicArticles } from "@/src/common/hooks/cms/use-list-public-articles";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Loader2, Key, FileText } from "lucide-react";
import Link from "next/link";

export default function PublicBlogPage() {
  const [secretKey, setSecretKey] = useState("");
  const [submittedKey, setSubmittedKey] = useState("");

  const { data: articlesData, isLoading, error } = useListPublicArticles(
    submittedKey,
    { page: 1, limit: 10 }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedKey(secretKey);
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-gray-100">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Public Blog Demo</h1>
          <p className="text-gray-400">
            Enter your blog secret key to view published articles
          </p>
        </div>

        <Card className="bg-[#16162a] border-gray-800">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Blog Secret Key
                </label>
                <Input
                  type="text"
                  placeholder="Enter your blog secret key"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="bg-[#0f0f1a] border-gray-700 text-gray-200"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!secretKey}
              >
                Load Articles
              </Button>
            </form>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {error && (
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-6">
              <p className="text-red-400">
                Failed to load articles. Please check your secret key.
              </p>
            </CardContent>
          </Card>
        )}

        {articlesData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Published Articles</h2>
              <span className="text-sm text-gray-400">
                {articlesData.meta.total} articles
              </span>
            </div>

            {articlesData.data.length === 0 ? (
              <Card className="bg-[#16162a] border-gray-800">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    No published articles
                  </h3>
                  <p className="text-gray-500">
                    This blog doesn't have any published articles yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {articlesData.data.map((article) => (
                  <Card
                    key={article.id}
                    className="bg-[#16162a] border-gray-800 hover:border-gray-700 transition-all"
                  >
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-gray-100 hover:text-blue-400 transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Published on{" "}
                          {new Date(article.published_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <div
                          className="text-gray-300 line-clamp-3"
                          dangerouslySetInnerHTML={{
                            __html: article.content.substring(0, 200) + "...",
                          }}
                        />
                        <Link
                          href={`/public-blog/${article.slug}?key=${submittedKey}`}
                          className="inline-block text-blue-400 hover:text-blue-300 text-sm font-medium"
                        >
                          Read more →
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {articlesData.meta.total_pages > 1 && (
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm text-gray-400">
                  Page {articlesData.meta.page} of {articlesData.meta.total_pages}
                </span>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
