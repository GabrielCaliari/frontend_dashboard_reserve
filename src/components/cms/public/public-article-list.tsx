/**
 * PublicArticleList Component
 * 
 * Displays a list of published articles for public consumption.
 * Supports grid/list layout, pagination, loading states, and empty states.
 * 
 * Requirements: 19.1, 19.2
 */

import React from'react';
import { Article } from'@/src/common/@types/@cms-article';
import { Skeleton, Button } from"@heroui/react";
import PublicArticleCard from'./public-article-card';

export interface PublicArticleListProps {
 articles: Article[];
 isLoading: boolean;
 pagination: {
 currentPage: number;
 totalPages: number;
 onPageChange: (page: number) => void;
 };
 layout?:'grid' |'list';
}

/**
 * Loading skeleton for article list
 */
const ArticleListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
 return (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {Array.from({ length: count }).map((_, index) => (
 <div key={index} className="space-y-3">
 <Skeleton className="rounded-lg">
 <div className="h-48 rounded-lg bg-default-100"></div>
 </Skeleton>
 <Skeleton className="w-3/5 rounded-lg">
 <div className="h-4 rounded-lg bg-default-100"></div>
 </Skeleton>
 <Skeleton className="w-4/5 rounded-lg">
 <div className="h-4 rounded-lg bg-default-100"></div>
 </Skeleton>
 <Skeleton className="w-2/5 rounded-lg">
 <div className="h-3 rounded-lg bg-default-100"></div>
 </Skeleton>
 </div>
 ))}
 </div>
 );
};

/**
 * Empty state when no articles exist
 */
const EmptyState: React.FC = () => {
 return (
 <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
 <div className="w-24 h-24 mb-6 rounded-full bg-default-100 flex items-center justify-center">
 <svg
 className="w-12 h-12 text-muted-foreground"
 fill="none"
 stroke="currentColor"
 viewBox="0 0 24 24"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
 />
 </svg>
 </div>
 <h3 className="text-xl font-semibold text-foreground mb-2">
 No articles yet
 </h3>
 <p className="text-muted-foreground max-w-md">
 There are no published articles at the moment. Check back soon for new content!
 </p>
 </div>
 );
};

/**
 * Pagination controls
 */
const PaginationControls: React.FC<{
 currentPage: number;
 totalPages: number;
 onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
 if (totalPages <= 1) return null;

 const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
 const showEllipsis = totalPages > 7;

 // Calculate visible page numbers
 let visiblePages: (number |'ellipsis')[] = pages;
 if (showEllipsis) {
 if (currentPage <= 3) {
 visiblePages = [1, 2, 3, 4,'ellipsis', totalPages];
 } else if (currentPage >= totalPages - 2) {
 visiblePages = [1,'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
 } else {
 visiblePages = [1,'ellipsis', currentPage - 1, currentPage, currentPage + 1,'ellipsis', totalPages];
 }
 }

 return (
 <div className="flex items-center justify-center gap-2 mt-12">
 <Button
 size="sm"
 variant="flat"
 isDisabled={currentPage === 1}
 onPress={() => onPageChange(currentPage - 1)}
 >
 Previous
 </Button>

 <div className="flex items-center gap-1">
 {visiblePages.map((page, index) => {
 if (page ==='ellipsis') {
 return (
 <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
 ...
 </span>
 );
 }

 return (
 <Button
 key={page}
 size="sm"
 variant={currentPage === page ?'solid' :'light'}
 color={currentPage === page ?'primary' :'default'}
 onPress={() => onPageChange(page)}
 >
 {page}
 </Button>
 );
 })}
 </div>

 <Button
 size="sm"
 variant="flat"
 isDisabled={currentPage === totalPages}
 onPress={() => onPageChange(currentPage + 1)}
 >
 Next
 </Button>
 </div>
 );
};

/**
 * Main PublicArticleList component
 */
export const PublicArticleList: React.FC<PublicArticleListProps> = ({
 articles,
 isLoading,
 pagination,
 layout ='grid',
}) => {
 const sortedArticles = [...articles].sort((left, right) => {
 const leftDate = new Date(left.published_at ?? left.updated_at).getTime();
 const rightDate = new Date(right.published_at ?? right.updated_at).getTime();
 return rightDate - leftDate;
 });

 // Show loading skeleton
 if (isLoading) {
 return <ArticleListSkeleton />;
 }

 // Show empty state
 if (!articles || articles.length === 0) {
 return <EmptyState />;
 }

 // Render article list
 return (
 <div className="w-full">
 <div
 className={
 layout ==='grid'
 ?'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
 :'flex flex-col gap-6'
 }
 >
 {sortedArticles.map((article) => (
 <PublicArticleCard key={article.id} article={article} />
 ))}
 </div>

 <PaginationControls
 currentPage={pagination.currentPage}
 totalPages={pagination.totalPages}
 onPageChange={pagination.onPageChange}
 />
 </div>
 );
};

export default PublicArticleList;
