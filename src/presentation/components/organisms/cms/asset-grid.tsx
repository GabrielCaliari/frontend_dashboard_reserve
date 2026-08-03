"use client";

import { useState } from"react";
import {
 Card,
 CardBody,
 Image,
 Button,
 Chip,
 Skeleton,
 Spinner,
 Dropdown,
 DropdownTrigger,
 DropdownMenu,
 DropdownItem,
 Checkbox,
} from"@heroui/react";
import {
 MoreVertical,
 Eye,
 Edit,
 Download,
 Trash2,
 CheckCircle,
} from"lucide-react";
import { formatFileSize } from"@/src/shared/utils/format-file-size";
import type { CmsMediaId, MediaAsset } from"@/src/shared/domain/types/@cms-media";

interface AssetGridProps {
 assets: MediaAsset[];
 isLoading?: boolean;
 onSelect?: (asset: MediaAsset) => void;
 onDelete?: (id: CmsMediaId) => void;
 onEdit?: (asset: MediaAsset) => void;
 onView?: (asset: MediaAsset) => void;
 selectable?: boolean;
 selectedIds?: CmsMediaId[];
 emptyMessage?: string;
 /** Override the grid-cols classes. Defaults to full-page responsive set. */
 gridCols?: string;
}

/**
 * Asset Grid Component
 * 
 * Displays media assets in a responsive grid layout with thumbnails,
 * metadata, and action menus. Supports selection mode for media picker.
 * 
 * Features:
 * - Responsive grid (1-6 columns based on screen size)
 * - Lazy loading for images
 * - Action menu per asset (view, edit, download, delete)
 * - Selection mode for media picker
 * - File size and dimensions display
 * - Status badges for non-active assets
 * 
 * @param assets - Array of media assets to display
 * @param isLoading - Loading state
 * @param onSelect - Callback when asset is selected (selection mode)
 * @param onDelete - Callback when delete action is triggered
 * @param onEdit - Callback when edit action is triggered
 * @param onView - Callback when view action is triggered
 * @param selectable - Enable selection mode
 * @param selectedIds - Array of selected asset IDs
 * @param emptyMessage - Custom message when no assets found
 */
export function AssetGrid({
 assets,
 isLoading = false,
 onSelect,
 onDelete,
 onEdit,
 onView,
 selectable = false,
 selectedIds = [],
 emptyMessage ="No assets found",
 gridCols ="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6",
}: AssetGridProps) {
 const [imageErrors, setImageErrors] = useState<Set<CmsMediaId>>(new Set());

 const handleImageError = (assetId: CmsMediaId) => {
 setImageErrors((prev) => new Set(prev).add(assetId));
 };

 if (isLoading) {
 return (
 <div className="flex justify-center items-center h-64">
 <Spinner size="lg" label="Loading assets..." />
 </div>
 );
 }

 if (assets.length === 0) {
 return (
 <div className="text-center py-12">
 <p className="text-muted-foreground">{emptyMessage}</p>
 </div>
 );
 }

 return (
 <div className={`grid gap-3 ${gridCols}`}>
 {assets.map((asset) => {
 const isSelected = selectedIds.includes(asset.id);
 const isImage = asset.mime_type.startsWith("image/");
 const hasImageError = imageErrors.has(asset.id);

 // Show skeleton only when the asset has no URL yet (conversion in progress).
 // If a URL exists, render the image regardless of status so we never
 // block display for assets that are actually accessible.
 const isProcessing = asset.status ==="processing" && !asset.url;

 return (
 <Card
 key={asset.id}
 isPressable={selectable && !isProcessing}
 isHoverable={!isProcessing}
 className={`${
 isSelected ?"ring-2 ring-primary" :""
 } transition-all duration-200`}
 onPress={() => selectable && !isProcessing && onSelect?.(asset)}
 >
 <CardBody className="p-0">
 {/* Preview */}
 <div className="aspect-square bg-default-100 relative overflow-hidden">
 {isProcessing ? (
 <Skeleton className="w-full h-full" />
 ) : isImage && !hasImageError ? (
 <Image
 src={asset.url}
 alt={asset.alt_text || asset.filename}
 className="object-cover w-full h-full"
 loading="lazy"
 onError={() => handleImageError(asset.id)}
 removeWrapper
 />
 ) : (
 <div className="flex items-center justify-center h-full">
 <span className="text-4xl text-muted-foreground">
 {getFileIcon(asset.mime_type)}
 </span>
 </div>
 )}

 {/* Selection Indicator */}
 {selectable && !isProcessing && (
 <div className="absolute top-2 left-2">
 <Checkbox
 isSelected={isSelected}
 onValueChange={() => onSelect?.(asset)}
 size="lg"
 color="primary"
 icon={({ isSelected: _isSelected, disableAnimation: _disableAnimation, isIndeterminate: _isIndeterminate, ...iconProps }) => (
 <CheckCircle {...iconProps} className="w-4 h-4" />
 )}
 />
 </div>
 )}

 {/* Status Badge */}
 {asset.status ==="failed" && (
 <Chip
 size="sm"
 color="danger"
 variant="flat"
 className="absolute top-2 right-2"
 >
 failed
 </Chip>
 )}
 </div>

 {/* Info */}
 <div className="p-3">
 {isProcessing ? (
 <div className="space-y-2">
 <Skeleton className="h-3 w-3/4 rounded" />
 <Skeleton className="h-3 w-1/2 rounded" />
 </div>
 ) : (
 <>
 <p
 className="text-sm font-medium truncate"
 title={asset.filename}
 >
 {asset.filename}
 </p>

 <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
 <span>{formatFileSize(asset.file_size)}</span>
 {asset.width && asset.height && (
 <span>
 {asset.width}×{asset.height}
 </span>
 )}
 </div>
 </>
 )}

 {/* Actions */}
 {!selectable && !isProcessing && (
 <div className="flex items-center justify-between mt-3">
 <Button
 size="sm"
 variant="flat"
 isIconOnly
 as="a"
 href={asset.url}
 download
 target="_blank"
 rel="noopener noreferrer"
 title="Download"
 >
 <Download className="w-4 h-4" />
 </Button>

 <Dropdown>
 <DropdownTrigger>
 <Button size="sm" variant="light" isIconOnly>
 <MoreVertical className="w-4 h-4" />
 </Button>
 </DropdownTrigger>
 <DropdownMenu aria-label="Asset actions">
 {onView ? (
 <DropdownItem
 key="view"
 startContent={<Eye className="w-4 h-4" />}
 onPress={() => onView(asset)}
 >
 View Details
 </DropdownItem>
 ) : null}
 {onEdit ? (
 <DropdownItem
 key="edit"
 startContent={<Edit className="w-4 h-4" />}
 onPress={() => onEdit(asset)}
 >
 Edit
 </DropdownItem>
 ) : null}
 <DropdownItem
 key="download"
 startContent={<Download className="w-4 h-4" />}
 onPress={() => {
 const link = document.createElement("a");
 link.href = asset.url;
 link.download = asset.filename;
 link.target ="_blank";
 link.rel ="noopener noreferrer";
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 }}
 >
 Download
 </DropdownItem>
 {onDelete ? (
 <DropdownItem
 key="delete"
 startContent={<Trash2 className="w-4 h-4" />}
 onPress={() => onDelete(asset.id)}
 className="text-danger"
 color="danger"
 >
 Delete
 </DropdownItem>
 ) : null}
 </DropdownMenu>
 </Dropdown>
 </div>
 )}
 </div>
 </CardBody>
 </Card>
 );
 })}
 </div>
 );
}

/**
 * Get appropriate icon for file type
 */
function getFileIcon(mimeType: string): string {
 if (mimeType.startsWith("image/")) return"🖼️";
 if (mimeType.startsWith("video/")) return"🎥";
 if (mimeType.startsWith("audio/")) return"🎵";
 if (mimeType.includes("pdf")) return"📄";
 if (mimeType.includes("word") || mimeType.includes("document")) return"📝";
 if (mimeType.includes("sheet") || mimeType.includes("excel")) return"📊";
 if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
 return"📽️";
 if (mimeType.includes("zip") || mimeType.includes("archive")) return"📦";
 return"📄";
}
