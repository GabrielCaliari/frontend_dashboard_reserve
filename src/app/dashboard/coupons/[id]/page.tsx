"use client";

import { useParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { ArrowLeft, Tag, Trash2, Link2 } from "lucide-react";
import { Button, Card, CardBody, Spinner } from "@heroui/react";
import { useTranslations } from "next-intl";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useGetCoupon, useUpdateCoupon } from "@/src/common/hooks/useCoupons";
import { CouponSummaryCard } from "@/src/components/coupons/coupon-summary-card";
import { CouponForm } from "@/src/components/coupons/coupon-form";
import { CouponDeactivateModal } from "@/src/components/coupons/coupon-deactivate-modal";
import { CouponLinkModal } from "@/src/components/coupons/coupon-link-modal";
import { toast } from "@/src/common/hooks/use-toast";
import { mapErrorMessage } from "@/src/common/utils/error-message-mapper";
import type { UpdateCouponPayload } from "@/src/common/@types/@coupons";
import { useState } from "react";

export default function CouponDetailPage() {
  const t = useTranslations("coupons");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  const { data: coupon, isLoading, isError } = useGetCoupon(id);
  const { mutateAsync: updateCoupon, isPending } = useUpdateCoupon(id);

  async function handleSubmit(payload: UpdateCouponPayload) {
    try {
      await updateCoupon(payload);
      toast({ title: t("updateSuccess"), variant: "default" });
    } catch (err) {
      const message = mapErrorMessage(err, t("updateError"));
      toast({ title: message, variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <LayoutScopeRoot>
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </LayoutScopeRoot>
    );
  }

  if (isError || !coupon) {
    return (
      <LayoutScopeRoot>
        <div className="px-6 py-6 max-w-3xl mx-auto">
          <Card className="border-red-500/20 bg-red-500/5">
            <CardBody className="p-8 text-center">
              <p className="text-red-400">{t("notFound")}</p>
              <Button
                variant="flat"
                className="mt-4"
                onPress={() => router.push("/dashboard/coupons")}
              >
                {t("backToList")}
              </Button>
            </CardBody>
          </Card>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <LayoutScopeRoot>
      <div className="px-6 py-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="light"
            startContent={<ArrowLeft className="w-4 h-4" />}
            className="text-muted-foreground -ml-2"
            onPress={() => router.push("/dashboard/coupons")}
          >
            {t("back")}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              color="primary"
              variant="flat"
              size="sm"
              startContent={<Link2 className="w-4 h-4" />}
              onPress={() => setLinkOpen(true)}
            >
              {t("copyLink")}
            </Button>

            {coupon.active && (
              <Button
                color="danger"
                variant="flat"
                size="sm"
                startContent={<Trash2 className="w-4 h-4" />}
                onPress={() => setDeactivateOpen(true)}
              >
                {t("deactivateCoupon")}
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Tag className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {t("detailTitle")}
          </h1>
        </div>

        <CouponSummaryCard coupon={coupon} />

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
            {t("editSectionTitle")}
          </h2>
          <CouponForm
            initialData={coupon}
            isSubmitting={isPending}
            onSubmit={(payload) => handleSubmit(payload as UpdateCouponPayload)}
          />
        </div>
      </div>

      {deactivateOpen && (
        <CouponDeactivateModal
          coupon={coupon}
          isOpen={deactivateOpen}
          onClose={() => setDeactivateOpen(false)}
        />
      )}

      {linkOpen && (
        <CouponLinkModal
          coupon={coupon}
          isOpen={linkOpen}
          onClose={() => setLinkOpen(false)}
        />
      )}
    </LayoutScopeRoot>
  );
}
