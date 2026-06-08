"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/presentation/components/atoms/shadcn-ui/dialog";
import type { EntityActionState } from "./types";

interface EntityActionHostProps {
  state: EntityActionState;
  onStart(): void;
  onFail(error: Error): void;
  onComplete(): void;
  onClose(): void;
}

export function EntityActionHost({
  state,
  onStart,
  onFail,
  onComplete,
  onClose,
}: EntityActionHostProps) {
  const queryClient = useQueryClient();
  const descriptor = state.descriptor;
  const isEdit = descriptor?.kind === "edit";
  const confirm = useCallback(async () => {
    if (!descriptor || descriptor.kind === "edit") return;
    onStart();
    try {
      await descriptor.mutation(descriptor.entity);
      await Promise.all(
        descriptor.invalidate.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
      toast.success(descriptor.successMessage);
      onComplete();
    } catch (error) {
      onFail(
        error instanceof Error ? error : new Error("Não foi possível concluir esta ação."),
      );
    }
  }, [descriptor, onComplete, onFail, onStart, queryClient]);

  if (!descriptor) return null;
  if (isEdit) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{descriptor.title}</DialogTitle>
          </DialogHeader>
          {descriptor.render({ close: onClose, complete: async () => onComplete() })}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{descriptor.title}</DialogTitle>
          <DialogDescription>{descriptor.description}</DialogDescription>
        </DialogHeader>
        {state.error ? (
          <p className="text-sm text-danger" role="alert">
            {state.error.message}
          </p>
        ) : null}
        <DialogFooter>
          <Button disabled={state.pending} type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={state.pending}
            type="button"
            variant={descriptor.tone === "danger" ? "destructive" : "default"}
            onClick={() => void confirm()}
          >
            {state.pending ? "Processando..." : descriptor.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
