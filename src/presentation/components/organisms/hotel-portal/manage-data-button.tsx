"use client";

import { Button } from "@heroui/react";
import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import usePermissions from "@/src/shared/hooks/use-permissions";

/**
 * Ponte super admin → rota de inserção (Plano §8 Fase 0).
 * Resolve o "fico preso, não acho a funcionalidade": nas telas read-only do
 * gerente, o super admin ganha um atalho para o painel de operação onde
 * insere/edita os dados daquele hotel.
 *
 * Só renderiza para super admin e quando há um clientId.
 */
export function ManageDataButton({
  clientId,
  tab,
  label = "Gerenciar dados",
}: {
  clientId?: string | null;
  /** Aba de destino no painel admin (ex: "ota", "report", "config"). */
  tab?: string;
  label?: string;
}) {
  const { isSuperAdmin } = usePermissions();
  const { push } = useRouter();

  if (!isSuperAdmin || !clientId) return null;

  const href = `/dashboard/hotel-portal/${clientId}${
    tab ? `?tab=${tab}` : ""
  }`;

  return (
    <Button
      size="sm"
      variant="flat"
      color="primary"
      className="rounded-2xl font-medium"
      startContent={<SlidersHorizontal className="h-4 w-4" />}
      onPress={() => push(href)}
    >
      {label}
    </Button>
  );
}
