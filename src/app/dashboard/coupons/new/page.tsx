"use client";

import { useRouter } from "nextjs-toploader/app";
import { ArrowLeft, Tag } from "lucide-react";
import { Button } from "@heroui/react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { CouponForm } from "@/src/components/coupons/coupon-form";
import { useCreateCoupon } from "@/src/common/hooks/useCoupons";
import { toast } from "@/src/common/hooks/use-toast";
import type { CreateCouponPayload } from "@/src/common/@types/@coupons";
import { isAxiosError } from "axios";

export default function CouponsNewPage() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateCoupon();

  async function handleSubmit(payload: CreateCouponPayload) {
    try {
      const created = await mutateAsync(payload as CreateCouponPayload);
      toast({ title: "Cupom criado com sucesso!", variant: "default" });
      router.push(`/dashboard/coupons/${created.id}`);
    } catch (err) {
      let message = "Erro ao criar cupom.";
      if (isAxiosError(err)) {
        if (err.response?.status === 409) {
          message = "Já existe um cupom com este código.";
        } else {
          message = err.response?.data?.message ?? message;
        }
      }
      toast({ title: message, variant: "destructive" });
    }
  }

  return (
    <LayoutScopeRoot>
      <div className="px-6 py-6 max-w-3xl mx-auto">
        {/* Back */}
        <Button
          variant="light"
          startContent={<ArrowLeft className="w-4 h-4" />}
          className="text-gray-400 mb-4 -ml-2"
          onPress={() => router.push("/dashboard/coupons")}
        >
          Voltar
        </Button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Tag className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-gray-100">Novo Cupom</h1>
          </div>
          <p className="text-sm text-gray-400 ml-11">
            Preencha os campos abaixo para criar um novo cupom de desconto.
          </p>
        </div>

        <div className="bg-[#111125] border border-gray-800 rounded-xl p-6">
          <CouponForm
            isSubmitting={isPending}
            onSubmit={(payload) => handleSubmit(payload as CreateCouponPayload)}
          />
        </div>
      </div>
    </LayoutScopeRoot>
  );
}
