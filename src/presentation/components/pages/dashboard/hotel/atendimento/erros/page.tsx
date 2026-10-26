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
import {
  DateRangeFilter,
  filterFieldClass,
  lastDays,
  type DateRange,
} from "@/src/presentation/components/organisms/hotel-portal/painel/date-range-filter";
import { Pagination } from "@/src/presentation/components/organisms/hotel-portal/painel/pagination";
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

/** 20 por pagina: uma tela, sem rolar sem fim. */
const PAGE_SIZE = 20;

/**
 * Erros do bot: falhas e pedidos de socorro reportados pelo WhatsApp.
 * A triagem muda so o status (aberto/visto/corrigido); o detalhe mostra o
 * trecho da conversa onde o bot errou e abre a conversa inteira.
 */
export default function BotErrosPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const clientId = client?.id ?? null;
  const { tenantId, hasPermission } = useTenantCapabilities();
  const canManage = hasPermission("hotel-portal.whatsapp-funnel.manage");
  const { isSuperAdmin } = usePermissions();

  const week = useMemo(() => lastDays(7), []);
  const [period, setPeriod] = useState<DateRange>(week);
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
  // A pagina volta para a primeira quando qualquer filtro muda.
  const filterKey = JSON.stringify(baseFilters);
  const [paged, setPaged] = useState({ key: filterKey, page: 1 });
  const page = paged.key === filterKey ? paged.page : 1;
  const filters = useMemo(() => ({ ...baseFilters, page, limit: PAGE_SIZE }), [baseFilters, page]);

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
      description="Falhas técnicas, problemas de conversa e pedidos de socorro reportados pelo bot do WhatsApp. Clique numa ocorrência para ver onde o bot errou."
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar os erros do bot."
    >
      {summary && <TopCodesCard porCodigo={summary.porCodigo} />}

      <PainelSection title="Ocorrências">
        <DateRangeFilter value={period} onChange={setPeriod}>
          <label className="flex items-center gap-1.5 text-xs text-foreground/60">
            Categoria
            <select
              className={filterFieldClass}
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
          <label className="flex items-center gap-1.5 text-xs text-foreground/60">
            Status
            <select
              className={filterFieldClass}
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
          <label className="flex items-center gap-1.5 text-xs text-foreground/60">
            Código
            <input
              className={filterFieldClass}
              placeholder="Ex.: WF_TIMEOUT"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </label>
        </DateRangeFilter>

        {list && list.items.length > 0 ? (
          <>
            <BotIssuesTable items={list.items} onOpen={setOpenId} />
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={list.total}
              isLoading={isFetching}
              onChange={(p) => setPaged({ key: filterKey, page: p })}
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
