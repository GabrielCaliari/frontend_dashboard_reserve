"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { AlertTriangle } from "lucide-react";
import { useDeactivateCoupon } from "@/src/common/hooks/useCoupons";
import { toast } from "@/src/common/hooks/use-toast";
import type { DiscountCoupon } from "@/src/common/@types/@coupons";
import { isAxiosError } from "axios";

interface CouponDeactivateModalProps {
  coupon: DiscountCoupon;
  isOpen: boolean;
  onClose: () => void;
}

export function CouponDeactivateModal({
  coupon,
  isOpen,
  onClose,
}: CouponDeactivateModalProps) {
  const { mutateAsync, isPending } = useDeactivateCoupon();

  async function handleConfirm() {
    try {
      await mutateAsync(coupon.id);
      toast({ title: "Cupom desativado com sucesso.", variant: "default" });
      onClose();
    } catch (err) {
      const message =
        isAxiosError(err) ? err.response?.data?.message ?? "Erro ao desativar cupom." : "Erro ao desativar cupom.";
      toast({ title: message, variant: "destructive" });
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="sm">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          Desativar cupom
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-300">
            Tem certeza que deseja desativar o cupom{" "}
            <span className="font-mono font-semibold text-gray-100">{coupon.code}</span>?
          </p>
          <p className="text-xs text-gray-500 mt-1">
            O cupom pode ser reativado a qualquer momento editando-o.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isPending}>
            Cancelar
          </Button>
          <Button color="danger" onPress={handleConfirm} isLoading={isPending}>
            Desativar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
