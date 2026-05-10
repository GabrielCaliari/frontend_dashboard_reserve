"use client";

import { useParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { ArrowLeft, Tag } from "lucide-react";
import { Button, Card, CardBody, Spinner } from "@heroui/react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useGetCoupon, useUpdateCoupon } from "@/src/common/hooks/useCoupons";
import { CouponSummaryCard } from "@/src/components/coupons/coupon-summary-card";
import { CouponForm } from "@/src/components/coupons/coupon-form";
import { CouponDeactivateModal } from "@/src/components/coupons/coupon-deactivate-modal";
import { toast } from "@/src/common/hooks/use-toast";
import type { UpdateCouponPayload } from "@/src/common/@types/@coupons";
import { isAxiosError } from "axios";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export default function CouponDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const { data: coupon, isLoading, isError } = useGetCoupon(id);
  const { mutateAsync: updateCoupon, isPending } = useUpdateCoupon(id);

  async function handleSubmit(payload: UpdateCouponPayload) {
    try {
      await updateCoupon(payload);
      toast({ title: "Cupom atualizado com sucesso!", variant: "default" });
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message ?? "Erro ao atualizar cupom."
        : "Erro ao atualizar cupom.";
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
              <p className="text-red-400">Cupom não encontrado.</p>
              <Button
                variant="flat"
                className="mt-4"
                onPress={() => router.push("/dashboard/coupons")}
              >
                Voltar para lista
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
        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="light"
            startContent={<ArrowLeft className="w-4 h-4" />}
            className="text-gray-400 -ml-2"
            onPress={() => router.push("/dashboard/coupons")}
          >
            Voltar
          </Button>

          {coupon.active && (
            <Button
              color="danger"
              variant="flat"
              size="sm"
              startContent={<Trash2 className="w-4 h-4" />}
              onPress={() => setDeactivateOpen(true)}
            >
              Desativar cupom
            </Button>
          )}
        </div>

        {/* Page heading */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Tag className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-gray-100">Detalhes do Cupom</h1>
        </div>

        {/* Summary */}
        <CouponSummaryCard coupon={coupon} />

        {/* Edit form */}
        <div className="bg-[#111125] border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
            Editar Cupom
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
    </LayoutScopeRoot>
  );
}
