"use client";

import { useState, useEffect } from "react";
import {
  Avatar,
  Button,
  Chip,
  Divider,
  Input,
  Textarea,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  Edit,
  Eye,
  Trash2,
  Calendar,
  Clock,
  Globe,
  Hash,
  CheckCircle,
  Archive,
  ArchiveRestore,
  Save,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/src/presentation/components/atoms/shadcn-ui/sheet";
import ArticleStatusBadge from "./article-status-badge";
import type { Article } from "@/src/shared/domain/types/@cms-article";
import type { Author } from "@/src/shared/domain/types/@cms-author";

interface ArticleQuickEditDrawerProps {
  article: Article | null;
  authors: Author[];
  isOpen: boolean;
  onClose: () => void;
  onEditClick: (article: Article) => void;
  onPreviewClick?: (article: Article) => void;
  onPublish: (article: Article) => void;
  onArchive: (article: Article) => void;
  onUnarchive: (article: Article) => void;
  onDelete: (article: Article) => void;
  onSave: (articleId: number, blogId: number, data: any) => void;
  isStatusActionPending?: boolean;
  isSaving?: boolean;
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function ArticleQuickEditDrawer({
  article,
  authors,
  isOpen,
  onClose,
  onEditClick,
  onPreviewClick,
  onPublish,
  onArchive,
  onUnarchive,
  onDelete,
  onSave,
  isStatusActionPending = false,
  isSaving = false,
}: ArticleQuickEditDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    metaTitle: "",
    metaDescription: "",
    language: "en_us",
    authorId: "",
  });

  // Initialize form data when article changes
  useEffect(() => {
    if (article) {
      setFormData({
        metaTitle: article.metaTitle || "",
        metaDescription: article.metaDescription || "",
        language: article.language || "en_us",
        authorId: article.authorId || "",
      });
      setIsEditing(false);
    }
  }, [article]);

  if (!article) return null;

  const canPublish = article.status === "draft";
  const canArchive = article.status === "published";
  const canUnarchive = article.status === "archived";
  const canDelete = article.status === "draft" || article.status === "archived";

  const getAuthorName = (authorId?: string) => {
    if (!authorId) return "No author";
    const author = authors.find((a) => a.id === authorId);
    return author ? `${author.firstName} ${author.lastName}` : "Unknown author";
  };

  const handleSave = () => {
    const updateData: any = {};

    if (formData.metaTitle !== (article.metaTitle || "")) {
      updateData.metaTitle = formData.metaTitle;
    }
    if (formData.metaDescription !== (article.metaDescription || "")) {
      updateData.metaDescription = formData.metaDescription;
    }
    if (formData.language !== (article.language || "en_us")) {
      updateData.language = formData.language;
    }
    if (formData.authorId !== (article.authorId || "")) {
      updateData.authorId = formData.authorId;
    }

    if (Object.keys(updateData).length > 0) {
      onSave(Number(article.id), Number(article.blog_id), updateData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      metaTitle: article.metaTitle || "",
      metaDescription: article.metaDescription || "",
      language: article.language || "en_us",
      authorId: article.authorId || "",
    });
    setIsEditing(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col overflow-hidden">
        <SheetHeader>
          <div className="flex items-start gap-3 pr-8">
            <div className="flex-1 min-w-0">
              <SheetTitle className="leading-snug line-clamp-2">
                {article.displayTitle || article.title}
              </SheetTitle>
              <SheetDescription className="mt-1 font-mono text-xs truncate">
                /{article.slug}
              </SheetDescription>
            </div>
            <ArticleStatusBadge status={article.status} />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
          {/* Status Actions */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </h3>
            <div className="flex flex-col gap-2">
              {canPublish && (
                <Button
                  color="success"
                  variant="flat"
                  startContent={<CheckCircle size={16} />}
                  onPress={() => onPublish(article)}
                  isLoading={isStatusActionPending}
                  className="justify-start"
                >
                  Publish Article
                </Button>
              )}
              {canArchive && (
                <Button
                  color="warning"
                  variant="flat"
                  startContent={<Archive size={16} />}
                  onPress={() => onArchive(article)}
                  isLoading={isStatusActionPending}
                  className="justify-start"
                >
                  Archive Article
                </Button>
              )}
              {canUnarchive && (
                <Button
                  color="success"
                  variant="flat"
                  startContent={<ArchiveRestore size={16} />}
                  onPress={() => onUnarchive(article)}
                  isLoading={isStatusActionPending}
                  className="justify-start"
                >
                  Restore to Published
                </Button>
              )}
            </div>
          </section>

          <Divider className="bg-default-100" />

          {/* Quick Edit Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Edit
              </h3>
              {!isEditing && (
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  onPress={() => setIsEditing(true)}
                  startContent={<Edit size={14} />}
                >
                  Edit Metadata
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <Input
                  label="Meta Title"
                  placeholder="SEO title for search engines"
                  value={formData.metaTitle}
                  onValueChange={(value) =>
                    setFormData({ ...formData, metaTitle: value })
                  }
                  size="sm"
                  classNames={{
                    label: "text-xs text-muted-foreground",
                    input: "text-sm",
                  }}
                />
                <Textarea
                  label="Meta Description"
                  placeholder="SEO description for search engines"
                  value={formData.metaDescription}
                  onValueChange={(value) =>
                    setFormData({ ...formData, metaDescription: value })
                  }
                  size="sm"
                  minRows={3}
                  classNames={{
                    label: "text-xs text-muted-foreground",
                    input: "text-sm",
                  }}
                />
                <Select
                  label="Language"
                  selectedKeys={[formData.language]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFormData({ ...formData, language: selected });
                  }}
                  size="sm"
                  classNames={{
                    label: "text-xs text-muted-foreground",
                    value: "text-sm uppercase",
                  }}
                >
                  <SelectItem key="en_us" value="en_us">
                    EN_US
                  </SelectItem>
                  <SelectItem key="pt_br" value="pt_br">
                    PT_BR
                  </SelectItem>
                  <SelectItem key="es_es" value="es_es">
                    ES_ES
                  </SelectItem>
                </Select>
                <Select
                  label="Author"
                  selectedKeys={formData.authorId ? [formData.authorId] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFormData({ ...formData, authorId: selected });
                  }}
                  size="sm"
                  classNames={{
                    label: "text-xs text-muted-foreground",
                    value: "text-sm",
                  }}
                  renderValue={(items) =>
                    items.map((item) => {
                      const author = authors.find((a) => a.id === item.key);
                      if (!author)
                        return <span key={item.key}>{item.textValue}</span>;
                      return (
                        <div
                          key={author.id}
                          className="flex items-center gap-2"
                        >
                          <Avatar
                            src={
                              author.avatar_url ??
                              author.avatar?.url ??
                              undefined
                            }
                            name={`${author.firstName} ${author.lastName}`}
                            className="h-5 w-5 text-[9px]"
                          />
                          <span>
                            {author.firstName} {author.lastName}
                          </span>
                        </div>
                      );
                    })
                  }
                >
                  {authors.map((author) => (
                    <SelectItem
                      key={author.id}
                      value={author.id}
                      textValue={`${author.firstName} ${author.lastName}`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={
                            author.avatar_url ?? author.avatar?.url ?? undefined
                          }
                          name={`${author.firstName} ${author.lastName}`}
                          className="h-6 w-6 text-[10px]"
                        />
                        <span>
                          {author.firstName} {author.lastName}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>

                <div className="flex gap-2 pt-2">
                  <Button
                    color="primary"
                    size="sm"
                    onPress={handleSave}
                    isLoading={isSaving}
                    startContent={<Save size={14} />}
                    className="flex-1"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="flat"
                    size="sm"
                    onPress={handleCancel}
                    startContent={<X size={14} />}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-muted-foreground mb-1">
                    Meta Title
                  </dt>
                  <dd className="text-sm text-foreground">
                    {article.metaTitle || (
                      <span className="text-muted-foreground italic">
                        Not set
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground mb-1">
                    Meta Description
                  </dt>
                  <dd className="text-sm text-foreground">
                    {article.metaDescription || (
                      <span className="text-muted-foreground italic">
                        Not set
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            )}
          </section>

          <Divider className="bg-default-100" />

          {/* Meta Info */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Details
            </h3>
            <dl className="space-y-3">
              <div className="flex items-center gap-3">
                <Hash size={15} className="text-muted-foreground shrink-0" />
                <dt className="text-sm text-muted-foreground w-24 shrink-0">
                  Article ID
                </dt>
                <dd className="text-sm text-foreground font-mono">
                  {article.id}
                </dd>
              </div>

              <div className="flex items-center gap-3">
                <Globe size={15} className="text-muted-foreground shrink-0" />
                <dt className="text-sm text-muted-foreground w-24 shrink-0">
                  Language
                </dt>
                <dd>
                  <Chip
                    size="sm"
                    variant="flat"
                    color="default"
                    className="uppercase"
                  >
                    {article.language ?? "en_us"}
                  </Chip>
                </dd>
              </div>

              <div className="flex items-center gap-3">
                <Hash size={15} className="text-muted-foreground shrink-0" />
                <dt className="text-sm text-muted-foreground w-24 shrink-0">
                  Author
                </dt>
                <dd className="text-sm text-foreground">
                  {getAuthorName(article.authorId)}
                </dd>
              </div>

              {article.published_at && (
                <div className="flex items-center gap-3">
                  <Calendar
                    size={15}
                    className="text-muted-foreground shrink-0"
                  />
                  <dt className="text-sm text-muted-foreground w-24 shrink-0">
                    Published
                  </dt>
                  <dd className="text-sm text-foreground">
                    {formatDate(article.published_at)}
                  </dd>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Clock size={15} className="text-muted-foreground shrink-0" />
                <dt className="text-sm text-muted-foreground w-24 shrink-0">
                  Updated
                </dt>
                <dd className="text-sm text-foreground">
                  {formatDate(article.updated_at)}
                </dd>
              </div>

              <div className="flex items-center gap-3">
                <Calendar
                  size={15}
                  className="text-muted-foreground shrink-0"
                />
                <dt className="text-sm text-muted-foreground w-24 shrink-0">
                  Created
                </dt>
                <dd className="text-sm text-foreground">
                  {formatDate(article.created_at)}
                </dd>
              </div>
            </dl>
          </section>

          {/* Cover Image */}
          {article.coverImage?.url && (
            <>
              <Divider className="bg-default-100" />
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cover Image
                </h3>
                <div className="rounded-lg overflow-hidden border border-border aspect-video bg-default-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.coverImage.url}
                    alt={article.coverImage.alt_text ?? article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border space-y-2">
          <Button
            color="primary"
            className="w-full"
            startContent={<Edit size={16} />}
            onPress={() => {
              onClose();
              onEditClick(article);
            }}
          >
            Edit Full Article
          </Button>

          {onPreviewClick && (
            <Button
              variant="flat"
              className="w-full"
              startContent={<Eye size={16} />}
              onPress={() => {
                onClose();
                onPreviewClick(article);
              }}
            >
              Preview
            </Button>
          )}

          {canDelete && (
            <Button
              color="danger"
              variant="light"
              className="w-full"
              startContent={<Trash2 size={16} />}
              onPress={() => {
                onClose();
                onDelete(article);
              }}
            >
              Delete Article
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
