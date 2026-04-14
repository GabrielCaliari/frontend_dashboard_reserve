"use client";

import { useRouter } from "nextjs-toploader/app";
import { ArrowLeft, Tag } from "lucide-react";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { CouponForm } from "@/src/components/coupons/coupon-form";
import { useCreateCoupon } from "@/src/common/hooks/useCoupons";
import { toast } from "@/src/shared/hooks/use-toast";
import { mapErrorMessage } from "@/src/shared/utils/error-message-mapper";
import type { CreateCouponPayload } from "@/src/shared/domain/types/@coupons";

export default function CouponsNewPage() {
  const t = useTranslations("coupons");
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateCoupon();

  async function handleSubmit(payload: CreateCouponPayload) {
    try {
      const created = await mutateAsync(payload as CreateCouponPayload);
      toast({ title: t("createSuccess"), variant: "default" });
      router.push(`/dashboard/coupons/${created.id}`);
    } catch (err) {
      const message = mapErrorMessage(err, t("createError"));
      toast({ title: message, variant: "destructive" });
    }
  }

  return (
    <LayoutScopeRoot>
      <div className="px-6 py-6 max-w-3xl mx-auto">
        <Button
          variant="light"
          startContent={<ArrowLeft className="w-4 h-4" />}
          className="text-muted-foreground mb-4 -ml-2"
          onPress={() => router.push("/dashboard/coupons")}
        >
          {t("back")}
        </Button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Tag className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {t("newCouponTitle")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            {t("newCouponSubtitle")}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <CouponForm
            isSubmitting={isPending}
            onSubmit={(payload) => handleSubmit(payload as CreateCouponPayload)}
          />
        </div>
      </div>
    </LayoutScopeRoot>
  );
}
