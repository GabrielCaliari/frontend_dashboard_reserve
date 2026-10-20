"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTenantCapabilities } from "@/src/modules/settings/presentation/hooks/tenant-capabilities-provider";
import usePermissions from "@/src/shared/hooks/use-permissions";
import {
  useActiveHotelClient,
  useBotIssue,
  useBotIssues,
  useBotIssuesSummary,
  useUpdateBotIssueStatus,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { LoadMoreFooter } from "@/src/presentation/components/organisms/hotel-portal/painel/load-more-footer";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { BotIssuesTable } from "@/src/presentation/components/organisms/hotel-portal/painel/bot-issues/bot-issues-table";
import { BotIssueDetailModal } from "@/src/presentation/components/organisms/hotel-portal/painel/bot-issues/bot-issue-detail";
import { TopCodesCard } from "@/src/presentation/components/organisms/hotel-portal/painel/bot-issues/top-codes-card";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
} from "@/src/presentation/components/organisms/hotel-portal/painel/bot-issues/labels";
import type {
  BotIssueCategory,
  BotIssueStatus,
} from "@/src/shared/domain/types/@hotel-painel";

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function lastDays(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  return { from: isoDay(from), to: isoDay(to) };
}

const PAGE_SIZE = 50;

const fieldClass = "rounded-lg border border-border bg-background px-3 py-2 text-sm";

/**
 * Erros do bot: falhas e pedidos de socorro reportados pelo WhatsApp.
 * A triagem muda so o status (aberto/visto/corrigido).
 */
export default function BotErrosPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const clientId = client?.id ?? null;
  const { tenantId, hasPermission } = useTenantCapabilities();
  const canManage = hasPermission("hotel-portal.whatsapp-funnel.manage");
  const { isSuperAdmin } = usePermissions();

  const week = useMemo(() => lastDays(7), []);
  const [period, setPeriod] = useState(week);
  const [categoria, setCategoria] = useState<BotIssueCategory | "">("");
  const [status, setStatus] = useState<BotIssueStatus | "">("");
  const [codigo, setCodigo] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const baseFilters = useMemo(
    () => ({
      from: period.from,
      to: period.to,
      ...(categoria ? { categoria } : {}),
      ...(status ? { status } : {}),
      ...(codigo.trim() ? { codigo: codigo.trim() } : {}),
    }),
    [period, categoria, status, codigo],
  );
  // O limite volta ao inicial quando qualquer filtro muda.
  const filterKey = JSON.stringify(baseFilters);
  const [loaded, setLoaded] = useState({ key: filterKey, limit: PAGE_SIZE });
  const limit = loaded.key === filterKey ? loaded.limit : PAGE_SIZE;
  const filters = useMemo(() => ({ ...baseFilters, limit }), [baseFilters, limit]);

  const { data: list, isLoading, isError, isFetching } = useBotIssues(clientId, filters);
  const { data: summary } = useBotIssuesSummary(clientId, week);
  const { data: detail, isLoading: detailLoading } = useBotIssue(clientId, openId);
  const updateStatus = useUpdateBotIssueStatus(tenantId, clientId);

  const handleChangeStatus = (id: string, next: BotIssueStatus) => {
    updateStatus.mutate(
      { id, status: next },
      {
        onSuccess: () => toast.success(`Marcado como ${STATUS_LABELS[next].toLowerCase()}.`),
        onError: () => toast.error("Não foi possível atualizar o status."),
      },
    );
  };

  return (
    <PainelPageShell
      title="Erros do bot"
      description="Falhas técnicas, problemas de conversa e pedidos de socorro reportados pelo bot do WhatsApp."
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar os erros do bot."
    >
      {summary && <TopCodesCard porCodigo={summary.porCodigo} />}

      <PainelSection title="Ocorrências">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs">
            De
            <input
              type="date"
              className={fieldClass}
              value={period.from}
              onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Até
            <input
              type="date"
              className={fieldClass}
              value={period.to}
              onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Categoria
            <select
              className={fieldClass}
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as BotIssueCategory | "")}
            >
              <option value="">Todas</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Status
            <select
              className={fieldClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as BotIssueStatus | "")}
            >
              <option value="">Todos</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Código
            <input
              className={fieldClass}
              placeholder="Ex.: WF_TIMEOUT"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </label>
        </div>

        {list && list.items.length > 0 ? (
          <>
            <BotIssuesTable items={list.items} onOpen={setOpenId} />
            <LoadMoreFooter
              shown={list.items.length}
              total={list.total}
              isLoading={isFetching}
              onLoadMore={() => setLoaded({ key: filterKey, limit: limit + PAGE_SIZE })}
            />
          </>
        ) : (
          <PortalEmptyState
            title="Nenhum erro encontrado"
            description="Não há ocorrências para os filtros escolhidos."
          />
        )}
      </PainelSection>

      <BotIssueDetailModal
        open={openId !== null}
        issue={detail}
        isLoading={detailLoading}
        canManage={canManage}
        isSuperAdmin={isSuperAdmin}
        isUpdating={updateStatus.isPending}
        onClose={() => setOpenId(null)}
        onChangeStatus={handleChangeStatus}
      />
    </PainelPageShell>
  );
}
