"use client";

import { useSearchParams } from "next/navigation";
import { useGetPublicArticle } from "@/src/common/hooks/cms/use-get-public-article";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PublicArticlePage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams();
  const secretKey = searchParams.get("key") || "";

  const { data: article, isLoading, error } = useGetPublicArticle(secretKey, params.slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] text-gray-100">
        <div className="max-w-4xl mx-auto p-6">
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold text-red-400 mb-2">Article Not Found</h2>
              <p className="text-gray-400 mb-6">
                The article you're looking for doesn't exist or is not published.
              </p>
              <Link href="/public-blog">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Blog
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-gray-100">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <Link href={`/public-blog?key=${secretKey}`}>
          <Button variant="ghost" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </Link>

        <article className="space-y-6">
          <header className="space-y-4">
            <h1 className="text-4xl font-bold">{article.title}</h1>
            <p className="text-gray-400">
              Published on{" "}
              {new Date(article.published_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </header>

          {article.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {article.images.map((image) => (
                <img
                  key={image.id}
                  src={image.url}
                  alt={image.alt_text}
                  className="rounded-lg w-full h-auto"
                />
              ))}
            </div>
          )}

          <Card className="bg-[#16162a] border-gray-800">
            <CardContent className="p-8">
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </CardContent>
          </Card>
        </article>
      </div>
    </div>
  );
}
