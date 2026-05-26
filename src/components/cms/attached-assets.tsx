"use client";

/**
 * AttachedAssets Component
 * 
 * Displays and manages media assets attached to an entity (article, blog, etc.).
 * Supports drag-and-drop reordering, asset attachment/detachment, and readonly mode.
 * 
 * Features:
 * - Fetch and display attached assets using useRelations hook
 * - Sortable list with drag handles using @dnd-kit/sortable
 * - Asset thumbnail, filename, and file size display
 * - "Attach Media" button to open media-picker modal
 * - Remove button per asset with confirmation
 * - Drag-and-drop reordering (disabled in readonly mode)
 * - Loading states during operations
 * - Empty state when no assets attached
 * 
 * **Validates: Requirements US-5.1, US-5.2, US-5.3, US-5.4, US-5.5, TR-3**
 * 
 * @param entityType - Type of entity (e.g., 'article', 'blog')
 * @param entityId - ID of the entity
 * @param readonly - Whether the component is in readonly mode (default: false)
 * 
 * @example
 * ```tsx
 * <AttachedAssets
 *   entityType="article"
 *   entityId={articleId}
 *   readonly={false}
 * />
 * ```
 */

import { useState, useMemo } from "react";
import { Button, Card, CardBody, Spinner, Chip } from "@heroui/react";
import { Paperclip, Trash2, GripVertical, Image as ImageIcon } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MediaPicker } from "./media-picker";
import {
  useRelations,
  useAttachAsset,
  useDetachAsset,
  useReorderRelations,
} from "@/src/common/hooks/cms/use-relations";
import { formatFileSize } from "@/src/common/utils/format-file-size";
import type { CmsMediaId, MediaAsset, MediaRelation } from "@/src/common/@types/@cms-media";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface AttachedAssetsProps {
  entityType: string;
  entityId: string;
  relationType?: string;
  readonly?: boolean;
}

/**
 * Sortable Asset Item Component
 * Individual asset item with drag handle, thumbnail, and remove button
 */
interface SortableAssetItemProps {
  relation: MediaRelation;
  readonly: boolean;
  onRemove: (assetId: CmsMediaId) => void;
}

function SortableAssetItem({ relation, readonly, onRemove }: SortableAssetItemProps) {
  const t = useTranslations("cms.attachedAssets");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: relation.id, disabled: readonly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const asset = relation.asset;
  if (!asset) return null;

  const isImage = asset.mime_type.startsWith("image/");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-gray-600 transition-colors"
    >
      {/* Drag Handle */}
      {!readonly && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          aria-label={t("dragHandle")}
        >
          <GripVertical size={20} />
        </button>
      )}

      {/* Thumbnail */}
      <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-md overflow-hidden flex items-center justify-center border border-border">
        {isImage ? (
          <img
            src={asset.url}
            alt={asset.alt_text || asset.filename}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon size={24} className="text-muted-foreground" />
        )}
      </div>

      {/* Asset Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {asset.filename}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatFileSize(asset.file_size)}
          </span>
          <Chip size="sm" variant="flat" className="text-xs">
            {asset.mime_type.split("/")[1].toUpperCase()}
          </Chip>
        </div>
      </div>

      {/* Remove Button */}
      {!readonly && (
        <Button
          isIconOnly
          size="sm"
          variant="light"
          color="danger"
          onPress={() => onRemove(relation.asset_id)}
          aria-label={t("removeAsset")}
        >
          <Trash2 size={16} />
        </Button>
      )}
    </div>
  );
}

/**
 * Main AttachedAssets Component
 */
export function AttachedAssets({
  entityType,
  entityId,
  relationType = "gallery",
  readonly = false,
}: AttachedAssetsProps) {
  const t = useTranslations("cms.attachedAssets");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Fetch relations for this entity
  const { data: relations = [], isLoading } = useRelations(entityType, entityId, relationType);

  // Mutations
  const attachAsset = useAttachAsset();
  const detachAsset = useDetachAsset();
  const reorderRelations = useReorderRelations();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort relations by display_order
  const sortedRelations = useMemo(() => {
    return [...relations].sort((a, b) => a.display_order - b.display_order);
  }, [relations]);

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sortedRelations.findIndex((r) => r.id === active.id);
    const newIndex = sortedRelations.findIndex((r) => r.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sortedRelations, oldIndex, newIndex);

    // Update display_order values
    const order = reordered.map((relation, index) => ({
      id: relation.id,
      display_order: index,
    }));

    try {
      await reorderRelations.mutateAsync({
        entity_type: entityType,
        entity_id: entityId,
        relation_type: relationType,
        relations: order,
      });
      toast.success(t("reorderSuccess"));
    } catch (error) {
      console.error("Failed to reorder assets:", error);
      toast.error(t("reorderError"));
    }
  };

  // Handle asset selection from picker
  const handleAssetSelect = async (assets: MediaAsset[]) => {
    if (assets.length === 0) return;

    try {
      // Attach each selected asset
      for (const asset of assets) {
        await attachAsset.mutateAsync({
          asset_id: asset.id,
          entity_type: entityType,
          entity_id: entityId,
          relation_type: relationType,
          display_order: sortedRelations.length,
        });
      }

      toast.success(
        assets.length === 1
          ? t("attachSuccess")
          : t("attachMultipleSuccess", { count: assets.length })
      );
      setIsPickerOpen(false);
    } catch (error) {
      console.error("Failed to attach assets:", error);
      toast.error(t("attachError"));
    }
  };

  // Handle asset removal
  const handleRemove = async (assetId: CmsMediaId) => {
    const confirmed = window.confirm(t("removeConfirmation"));
    if (!confirmed) return;

    try {
      await detachAsset.mutateAsync({
        asset_id: assetId,
        entity_type: entityType,
        entity_id: entityId,
        relation_type: relationType,
      });
      toast.success(t("removeSuccess"));
    } catch (error) {
      console.error("Failed to remove asset:", error);
      toast.error(t("removeError"));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="border border-border">
        <CardBody className="flex items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground mt-4">{t("loading")}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-border">
        <CardBody className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip size={20} className="text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">
                {t("title")}
              </h3>
              {sortedRelations.length > 0 && (
                <Chip size="sm" variant="flat">
                  {sortedRelations.length}
                </Chip>
              )}
            </div>

            {!readonly && (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                startContent={<Paperclip size={16} />}
                onPress={() => setIsPickerOpen(true)}
                isLoading={attachAsset.isPending}
              >
                {t("attachMedia")}
              </Button>
            )}
          </div>

          {/* Assets List */}
          {sortedRelations.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedRelations.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {sortedRelations.map((relation) => (
                    <SortableAssetItem
                      key={relation.id}
                      relation={relation}
                      readonly={readonly}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-12">
              <Paperclip size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-sm text-muted-foreground">
                {readonly ? t("noAssetsReadonly") : t("noAssetsEmpty")}
              </p>
              {!readonly && (
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  className="mt-4"
                  onPress={() => setIsPickerOpen(true)}
                >
                  {t("attachFirstAsset")}
                </Button>
              )}
            </div>
          )}

          {/* Loading overlay during operations */}
          {(detachAsset.isPending || reorderRelations.isPending) && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
              <Spinner size="lg" />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Media Picker Modal */}
      <MediaPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleAssetSelect}
        selectionMode="multiple"
      />
    </>
  );
}
