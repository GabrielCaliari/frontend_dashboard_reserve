'use client';

import { Chip } from '@nextui-org/react';
import type { Article } from '@/src/common/@types/@cms-article';

interface ArticleStatusBadgeProps {
  status: Article['status'];
}

/**
 * ArticleStatusBadge Component
 * 
 * Displays a visual status indicator for articles with color coding:
 * - Draft: Gray
 * - Published: Green
 * - Archived: Orange
 * 
 * Features:
 * - Color-coded badges for quick status identification
 * - Icon support for visual clarity
 * - Consistent styling with NextUI Chip component
 * 
 * **Validates: Requirements 17.7**
 */
export default function ArticleStatusBadge({ status }: ArticleStatusBadgeProps) {
  const statusConfig = {
    draft: {
      color: 'default' as const,
      label: 'Draft',
    },
    published: {
      color: 'success' as const,
      label: 'Published',
    },
    archived: {
      color: 'warning' as const,
      label: 'Archived',
    },
  };

  const config = statusConfig[status];

  return (
    <Chip
      color={config.color}
      variant="flat"
      size="sm"
    >
      {config.label}
    </Chip>
  );
}
