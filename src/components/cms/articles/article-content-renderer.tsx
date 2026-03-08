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
  if (!content.trim()) {
    return null;
  }

  if (isHtmlContent(content)) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={className}
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
  );
}