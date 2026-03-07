"use client";

import { Card, CardBody, Button, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { FolderOpen, Image, FileText, Video, Layers, MoreVertical, Pencil, Trash2, ArrowRight } from "lucide-react";
import type { MediaCollection, CollectionType } from "@/src/common/@types/@cms-media";

interface CollectionCardProps {
  collection: MediaCollection;
  onClick: (collection: MediaCollection) => void;
  onEdit: (collection: MediaCollection) => void;
  onDelete: (collection: MediaCollection) => void;
}

const TYPE_CONFIG: Record<CollectionType, { icon: React.ElementType; color: string; bg: string; badge: "success" | "primary" | "secondary" | "warning" }> = {
  images:    { icon: Image,    color: "text-emerald-400", bg: "bg-emerald-500/10",  badge: "success"   },
  documents: { icon: FileText, color: "text-blue-400",    bg: "bg-blue-500/10",     badge: "primary"   },
  videos:    { icon: Video,    color: "text-violet-400",  bg: "bg-violet-500/10",   badge: "secondary" },
  mixed:     { icon: Layers,   color: "text-amber-400",   bg: "bg-amber-500/10",    badge: "warning"   },
};

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function CollectionCard({ collection, onClick, onEdit, onDelete }: CollectionCardProps) {
  const config = TYPE_CONFIG[collection.type];
  const Icon = config.icon;

  return (
    <Card
      isPressable
      isHoverable
      onPress={() => onClick(collection)}
      className="bg-[#12121f] border border-gray-800/60 hover:border-gray-700 transition-all duration-200 group cursor-pointer"
    >
      <CardBody className="p-5">
        {/* Header: icon + actions menu */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
          <div className="flex items-center gap-1">
            <Chip
              size="sm"
              color={config.badge}
              variant="flat"
              className="text-xs capitalize"
            >
              {collection.type}
            </Chip>
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Collection options"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Collection actions">
                <DropdownItem
                  key="edit"
                  startContent={<Pencil className="w-4 h-4" />}
                  onPress={() => onEdit(collection)}
                >
                  Edit Collection
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  startContent={<Trash2 className="w-4 h-4" />}
                  className="text-danger"
                  color="danger"
                  onPress={() => onDelete(collection)}
                >
                  Delete Collection
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        {/* Collection name + description */}
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-100 truncate" title={collection.name}>
            {collection.name}
          </h3>
          {collection.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{collection.description}</p>
          )}
        </div>

        {/* Meta info */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Max file size</span>
            <span className="text-gray-400">{formatFileSize(collection.max_file_size)}</span>
          </div>
          {collection.max_items && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Max items</span>
              <span className="text-gray-400">{collection.max_items}</span>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-800/60">
          <div className="flex items-center gap-1 text-gray-600">
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="text-xs">Browse assets</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all duration-150" />
        </div>
      </CardBody>
    </Card>
  );
}
