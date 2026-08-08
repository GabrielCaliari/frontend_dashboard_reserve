"use client";

import { useFirstAccessTour } from "@/src/shared/hooks/use-first-access-tour";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/presentation/components/atoms/shadcn-ui/dialog";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";

export function FirstAccessTour() {
  const { shouldShow, dismiss } = useFirstAccessTour();

  return (
    <Dialog open={shouldShow} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bem-vindo ao Painel Reserve</DialogTitle>
          <DialogDescription>
            Aqui você acompanha investimento, conversas no WhatsApp, o que a Reserve fez pelo seu negócio e o plano
            dos próximos meses — tudo em tempo real, direto do celular.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={dismiss}>Entendi, vamos lá</Button>
      </DialogContent>
    </Dialog>
  );
}
