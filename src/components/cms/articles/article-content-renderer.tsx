import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/src/common/lib/utils";
import { sanitizeHtml } from "@/src/common/utils/content-sanitizer";

interface ArticleContentRendererProps {
  content: string;
  className?: string;
}

function isHtmlContent(content: string): boolean {
  return content.trim().startsWith("<");
}

export function ArticleContentRenderer({
  content,
  className,
}: ArticleContentRendererProps) {
  const contentClassName = cn(
    "[&_h1]:mt-10 [&_h1]:mb-6 [&_h1]:text-4xl [&_h1]:font-black [&_h1]:tracking-tight [&_h1]:text-foreground",
    "[&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-2",
    "[&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-foreground",
    className,
  );

  if (!content.trim()) {
    return null;
  }

  if (isHtmlContent(content)) {
    return (
      <div
        className={contentClassName}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    );
  }

  return (
    <div className={contentClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node: _node, className: linkClassName, href, ...props }) => {
            const isExternal = !!href && /^(https?:)?\/\//.test(href);

            return (
              <a
                {...props}
                href={href}
                className={linkClassName}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
              />
            );
          },
            h1: ({ node: _node, className: headingClassName, ...props }) => (
              <h1 {...props} className={cn(headingClassName)} />
            ),
            h2: ({ node: _node, className: headingClassName, ...props }) => (
              <h2 {...props} className={cn(headingClassName)} />
            ),
            h3: ({ node: _node, className: headingClassName, ...props }) => (
              <h3 {...props} className={cn(headingClassName)} />
            ),
          img: ({ node: _node, className: imageClassName, alt, ...props }) => (
            <img
              {...props}
              alt={alt ?? ""}
              loading="lazy"
              className={cn(
                "my-6 w-full rounded-lg border border-border bg-muted object-cover",
                imageClassName,
              )}
            />
          ),
          table: ({ node: _node, className: tableClassName, ...props }) => (
            <table
              {...props}
              className={cn("w-full border-collapse overflow-hidden", tableClassName)}
            />
          ),
          th: ({ node: _node, className: cellClassName, ...props }) => (
            <th {...props} className={cn("border border-border px-4 py-2 text-left", cellClassName)} />
          ),
          td: ({ node: _node, className: cellClassName, ...props }) => (
            <td {...props} className={cn("border border-border px-4 py-2 align-top", cellClassName)} />
          ),
          pre: ({ node: _node, className: preClassName, ...props }) => (
            <pre
              {...props}
              className={cn("overflow-x-auto rounded-lg border border-border bg-muted p-4", preClassName)}
            />
          ),
          code: ({ node: _node, className: codeClassName, ...props }) => (
            <code
              {...props}
              className={cn("rounded bg-muted px-1.5 py-0.5", codeClassName)}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}