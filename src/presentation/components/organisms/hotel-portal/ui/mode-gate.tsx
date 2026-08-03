"use client";

import { createContext, useContext } from "react";
import type {
  RenderMode,
  HotelClientDetail,
  IntegrationState,
} from "@/src/shared/domain/types/@hotel-portal-v1";

/**
 * Deriva o modo de renderização (Plano §2.5):
 *   bookingEngine != "none" E motor de reserva conectado → CONVERSÃO
 *   senão                                                → ATIVIDADE
 */
export function deriveRenderMode(
  client?: Pick<HotelClientDetail, "bookingEngine" | "integrations"> | null,
): RenderMode {
  if (!client || client.bookingEngine === "none") return "activity";
  const engine: IntegrationState | undefined = client.integrations?.find(
    (i) => i.provider === "booking_engine",
  );
  const connected =
    engine?.status === "connected" || engine?.status === "webhook";
  return connected ? "conversion" : "activity";
}

const ModeContext = createContext<RenderMode>("activity");

export function HotelModeProvider({
  mode,
  children,
}: {
  mode: RenderMode;
  children: React.ReactNode;
}) {
  return <ModeContext.Provider value={mode}>{children}</ModeContext.Provider>;
}

export function useRenderMode(): RenderMode {
  return useContext(ModeContext);
}

/**
 * Wrapper que só renderiza os filhos no modo certo (Doc 03 §3.2/§5.2).
 * Em modo ATIVIDADE, um <ModeGate mode="conversion"> NÃO monta nada —
 * não renderiza placeholder de ROAS. A tela é honesta por construção.
 */
export function ModeGate({
  mode,
  current,
  children,
}: {
  mode: RenderMode;
  /** Override opcional; por padrão lê o modo do contexto. */
  current?: RenderMode;
  children: React.ReactNode;
}) {
  const ctx = useContext(ModeContext);
  const active = current ?? ctx;
  if (active !== mode) return null;
  return <>{children}</>;
}
