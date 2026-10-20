"use client";

import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";

interface LoadMoreFooterProps {
  shown: number;
  total: number;
  isLoading?: boolean;
  onLoadMore: () => void;
}

/** Rodapé das listas do painel: "Mostrando X de N" e botão para carregar mais. */
export function LoadMoreFooter({ shown, total, isLoading = false, onLoadMore }: LoadMoreFooterProps) {
  return (
    <div className="flex items-center justify-between gap-3 pt-3 text-sm text-muted-foreground">
      <span>{`Mostrando ${shown} de ${total}`}</span>
      {shown < total && (
        <Button type="button" variant="outline" size="sm" disabled={isLoading} onClick={onLoadMore}>
          Carregar mais
        </Button>
      )}
    </div>
  );
}
