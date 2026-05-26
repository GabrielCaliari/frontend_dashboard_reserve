"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from"@heroui/react";
import { AlertTriangle } from"lucide-react";
import { useTranslations } from"next-intl";
import { useDeactivateCoupon } from"@/src/common/hooks/useCoupons";
import { toast } from"@/src/common/hooks/use-toast";
import type { DiscountCoupon } from"@/src/common/@types/@coupons";
import { isAxiosError } from"axios";

interface CouponDeactivateModalProps {
 coupon: DiscountCoupon;
 isOpen: boolean;
 onClose: () => void;
}

export function CouponDeactivateModal({ coupon, isOpen, onClose }: CouponDeactivateModalProps) {
 const t = useTranslations("coupons");
 const tCommon = useTranslations("common");
 const { mutateAsync, isPending } = useDeactivateCoupon();

 async function handleConfirm() {
 try {
 await mutateAsync(coupon.id);
 toast({ title: t("deactivateSuccess"), variant:"default" });
 onClose();
 } catch (err) {
 const message = isAxiosError(err)
 ? err.response?.data?.message ?? t("deactivateError")
 : t("deactivateError");
 toast({ title: message, variant:"destructive" });
 }
 }

 return (
 <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="sm">
 <ModalContent>
 <ModalHeader className="flex items-center gap-2">
 <AlertTriangle className="w-5 h-5 text-warning" />
 {t("deactivateModalTitle")}
 </ModalHeader>
 <ModalBody>
 <p className="text-sm text-foreground">
 {t("deactivateModalBody", { code: coupon.code })}
 </p>
 <p className="text-xs text-muted-foreground mt-1">{t("deactivateModalNote")}</p>
 </ModalBody>
 <ModalFooter>
 <Button variant="light" onPress={onClose} isDisabled={isPending}>
 {tCommon("cancel")}
 </Button>
 <Button color="danger" onPress={handleConfirm} isLoading={isPending}>
 {t("deactivateModalConfirm")}
 </Button>
 </ModalFooter>
 </ModalContent>
 </Modal>
 );
}
