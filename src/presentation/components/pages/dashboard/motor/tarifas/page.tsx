"use client";

import { useRef, useState } from "react";
import { Button, Card, CardBody, Checkbox, Input, Select, SelectItem } from "@heroui/react";
import { CalendarRange, Tag, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTenantCapabilities } from "@/src/modules/settings/presentation/hooks/tenant-capabilities-provider";
import {
  useCreatePolicy,
  useCreatePriceRule,
  useCreateSeason,
  useDeletePriceRule,
  useDeleteSeason,
  useMotorRoomTypes,
  useMotorTarifas,
  useUpdatePolicy,
  useUpsertDailyInventory,
} from "@/src/shared/hooks/motor";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { PortalDataTable } from "@/src/presentation/components/organisms/hotel-portal/painel/data-table";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { ConfirmModal } from "@/src/presentation/components/organisms/modals/confirm-modal";
import { DOW_OPTIONS, dowLabel } from "@/src/presentation/components/organisms/motor/dow";
import type { MotorPriceRule, MotorSeason } from "@/src/shared/domain/types/@motor";

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

// Alvo da exclusao: guarda o rotulo pra descrever o item no modal.
type DeleteTarget = { kind: "season" | "rule"; id: string; label: string };

export default function MotorTarifasPage() {
  const { tenantId, hasPermission } = useTenantCapabilities();
  const { data, isLoading, isError } = useMotorTarifas(tenantId);
  const { data: roomTypes } = useMotorRoomTypes(tenantId);
  const createSeason = useCreateSeason(tenantId);
  const deleteSeason = useDeleteSeason(tenantId);
  const createRule = useCreatePriceRule(tenantId);
  const deleteRule = useDeletePriceRule(tenantId);
  const createPolicy = useCreatePolicy(tenantId);
  const updatePolicy = useUpdatePolicy(tenantId);
  const upsertDay = useUpsertDailyInventory(tenantId);
  const canManage = hasPermission("motor.settings.manage");

  const [seasonForm, setSeasonForm] = useState({ nome: "", data_inicio: "", data_fim: "", prioridade: 0 });
  const [ruleForm, setRuleForm] = useState({ room_type_id: "", season_id: "", dow_mask: 127, preco_noite: 0, min_stay: 1 });
  const [dayForm, setDayForm] = useState({ room_type_id: "", data: "", preco: "", min_stay: "", stop_sell: false });
  const [policyDias, setPolicyDias] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const seasonFormRef = useRef<HTMLDivElement>(null);
  const ruleFormRef = useRef<HTMLDivElement>(null);

  const roomTypeName = (id: string) => roomTypes?.find((rt) => rt.id === id)?.nome ?? id;
  const seasonName = (id: string | null) => (id ? (data?.seasons.find((s) => s.id === id)?.nome ?? id) : "Fora de temporada");

  async function submit(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      toast.success(ok);
    } catch {
      toast.error("Algo deu errado — confira os campos");
    }
  }

  // Leva o usuario ate o formulario correspondente e ja foca o primeiro campo.
  function focusForm(ref: React.RefObject<HTMLDivElement | null>) {
    const container = ref.current;
    if (!container) return;
    if (typeof container.scrollIntoView === "function") {
      container.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    container.querySelector<HTMLElement>("input, select, button")?.focus();
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const { kind, id } = deleteTarget;
    setDeleteTarget(null);
    if (kind === "season") {
      await submit(() => deleteSeason.mutateAsync(id), "Temporada excluída");
    } else {
      await submit(() => deleteRule.mutateAsync(id), "Regra excluída");
    }
  }

  const policy = data?.policies[0];
  const seasons = data?.seasons ?? [];
  const priceRules = data?.price_rules ?? [];

  return (
    <PainelPageShell
      title="Tarifas"
      description="Temporadas, preços por dia da semana, mínimo de noites e política de cancelamento."
      isLoading={isLoading}
      isError={isError}
      errorMessage="Erro ao carregar as tarifas."
    >
      <div className="space-y-8">
        <PainelSection
          title="Temporadas"
          description="Períodos com preço próprio. A maior prioridade vence quando duas temporadas se sobrepõem."
        >
          <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
            <CardBody className="space-y-6 p-6">
              {seasons.length ? (
                <PortalDataTable<MotorSeason>
                  columns={[
                    { key: "nome", header: "Temporada", render: (s) => s.nome },
                    { key: "periodo", header: "Período", render: (s) => `${s.data_inicio} → ${s.data_fim}` },
                    { key: "prioridade", header: "Prioridade", render: (s) => s.prioridade },
                    ...(canManage
                      ? [
                          {
                            key: "acoes",
                            header: "Ações",
                            render: (s: MotorSeason) => (
                              <Button
                                isIconOnly
                                aria-label={`Excluir ${s.nome}`}
                                size="sm"
                                variant="light"
                                onPress={() => setDeleteTarget({ kind: "season", id: s.id, label: s.nome })}
                              >
                                <Trash2 className="h-4 w-4 text-danger" />
                              </Button>
                            ),
                          },
                        ]
                      : []),
                  ]}
                  getRowKey={(s) => s.id}
                  rows={seasons}
                />
              ) : (
                <PortalEmptyState
                  actionLabel={canManage ? "Criar temporada" : undefined}
                  description="Sem temporadas, a regra base vale o ano todo. Crie uma para cobrar mais na alta estação."
                  icon={CalendarRange}
                  title="Nenhuma temporada"
                  onAction={canManage ? () => focusForm(seasonFormRef) : undefined}
                />
              )}
              {canManage ? (
                <div ref={seasonFormRef} className="space-y-3 border-t border-border pt-6">
                  <p className="text-sm font-medium text-foreground">Nova temporada</p>
                  <div className="grid gap-3 sm:grid-cols-5">
                    <Input label="Nome" value={seasonForm.nome} onChange={(e) => setSeasonForm({ ...seasonForm, nome: e.target.value })} />
                    <Input label="Início" type="date" value={seasonForm.data_inicio} onChange={(e) => setSeasonForm({ ...seasonForm, data_inicio: e.target.value })} />
                    <Input label="Fim" type="date" value={seasonForm.data_fim} onChange={(e) => setSeasonForm({ ...seasonForm, data_fim: e.target.value })} />
                    <Input label="Prioridade" type="number" value={String(seasonForm.prioridade)} onChange={(e) => setSeasonForm({ ...seasonForm, prioridade: Number(e.target.value) || 0 })} />
                    <Button
                      className="self-end"
                      color="primary"
                      onPress={() =>
                        submit(async () => {
                          await createSeason.mutateAsync(seasonForm);
                          setSeasonForm({ nome: "", data_inicio: "", data_fim: "", prioridade: 0 });
                        }, "Temporada criada")
                      }
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </PainelSection>

        <PainelSection
          title="Regras de preço"
          description="O preço que o gerador aplica no calendário, por acomodação e dia da semana."
        >
          <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
            <CardBody className="space-y-6 p-6">
              {priceRules.length ? (
                <PortalDataTable<MotorPriceRule>
                  columns={[
                    { key: "acomodacao", header: "Acomodação", render: (r) => roomTypeName(r.room_type_id) },
                    { key: "temporada", header: "Temporada", render: (r) => seasonName(r.season_id) },
                    { key: "dias", header: "Dias", render: (r) => dowLabel(r.dow_mask) },
                    { key: "preco", header: "Preço/noite", render: (r) => fmtBRL(r.preco_noite) },
                    { key: "min_stay", header: "Mín. noites", render: (r) => r.min_stay },
                    ...(canManage
                      ? [
                          {
                            key: "acoes",
                            header: "Ações",
                            render: (r: MotorPriceRule) => (
                              <Button
                                isIconOnly
                                aria-label="Excluir regra"
                                size="sm"
                                variant="light"
                                onPress={() =>
                                  setDeleteTarget({
                                    kind: "rule",
                                    id: r.id,
                                    label: `${roomTypeName(r.room_type_id)} · ${dowLabel(r.dow_mask)} · ${fmtBRL(r.preco_noite)}`,
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4 text-danger" />
                              </Button>
                            ),
                          },
                        ]
                      : []),
                  ]}
                  getRowKey={(r) => r.id}
                  rows={priceRules}
                />
              ) : (
                <PortalEmptyState
                  actionLabel={canManage ? "Criar regra de preço" : undefined}
                  description="Sem regra de preço o calendário fica sem tarifa e a acomodação não é vendida."
                  icon={Tag}
                  title="Nenhuma regra de preço"
                  onAction={canManage ? () => focusForm(ruleFormRef) : undefined}
                />
              )}
              {canManage ? (
                <div ref={ruleFormRef} className="space-y-3 border-t border-border pt-6">
                  <p className="text-sm font-medium text-foreground">Nova regra</p>
                  <div className="grid gap-3 lg:grid-cols-6">
                    <Select
                      label="Acomodação"
                      selectedKeys={ruleForm.room_type_id ? [ruleForm.room_type_id] : []}
                      onChange={(e) => setRuleForm({ ...ruleForm, room_type_id: e.target.value })}
                    >
                      {(roomTypes ?? []).map((rt) => (
                        <SelectItem key={rt.id}>{rt.nome}</SelectItem>
                      ))}
                    </Select>
                    <Select
                      label="Temporada (opcional)"
                      selectedKeys={ruleForm.season_id ? [ruleForm.season_id] : []}
                      onChange={(e) => setRuleForm({ ...ruleForm, season_id: e.target.value })}
                    >
                      {seasons.map((s) => (
                        <SelectItem key={s.id}>{s.nome}</SelectItem>
                      ))}
                    </Select>
                    <div className="flex flex-wrap items-center gap-2 lg:col-span-2">
                      {DOW_OPTIONS.map((d) => (
                        <Checkbox
                          key={d.bit}
                          isSelected={(ruleForm.dow_mask & d.bit) !== 0}
                          size="sm"
                          onValueChange={(checked) =>
                            setRuleForm({
                              ...ruleForm,
                              dow_mask: checked ? ruleForm.dow_mask | d.bit : ruleForm.dow_mask & ~d.bit,
                            })
                          }
                        >
                          {d.label}
                        </Checkbox>
                      ))}
                    </div>
                    <Input label="Preço/noite" type="number" value={String(ruleForm.preco_noite)} onChange={(e) => setRuleForm({ ...ruleForm, preco_noite: Number(e.target.value) || 0 })} />
                    <div className="flex items-end gap-2">
                      <Input label="Mín. noites" type="number" value={String(ruleForm.min_stay)} onChange={(e) => setRuleForm({ ...ruleForm, min_stay: Number(e.target.value) || 1 })} />
                      <Button
                        color="primary"
                        onPress={() =>
                          submit(async () => {
                            await createRule.mutateAsync({
                              room_type_id: ruleForm.room_type_id,
                              season_id: ruleForm.season_id || undefined,
                              dow_mask: ruleForm.dow_mask,
                              preco_noite: ruleForm.preco_noite,
                              min_stay: ruleForm.min_stay,
                            });
                          }, "Regra criada — calendário atualizado")
                        }
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </PainelSection>

        <PainelSection
          title="Edição pontual de data"
          description="Ajusta uma única data. O valor gravado aqui não é sobrescrito pelo gerador de tarifas."
        >
          <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
            <CardBody className="grid gap-3 p-6 sm:grid-cols-6">
              <Select
                label="Acomodação"
                selectedKeys={dayForm.room_type_id ? [dayForm.room_type_id] : []}
                onChange={(e) => setDayForm({ ...dayForm, room_type_id: e.target.value })}
              >
                {(roomTypes ?? []).map((rt) => (
                  <SelectItem key={rt.id}>{rt.nome}</SelectItem>
                ))}
              </Select>
              <Input label="Data" type="date" value={dayForm.data} onChange={(e) => setDayForm({ ...dayForm, data: e.target.value })} />
              <Input label="Preço (opcional)" type="number" value={dayForm.preco} onChange={(e) => setDayForm({ ...dayForm, preco: e.target.value })} />
              <Input label="Mín. noites (opcional)" type="number" value={dayForm.min_stay} onChange={(e) => setDayForm({ ...dayForm, min_stay: e.target.value })} />
              <Checkbox className="self-end" isSelected={dayForm.stop_sell} onValueChange={(v) => setDayForm({ ...dayForm, stop_sell: v })}>
                Fechar venda
              </Checkbox>
              <Button
                className="self-end"
                color="primary"
                isDisabled={!canManage}
                onPress={() =>
                  submit(async () => {
                    await upsertDay.mutateAsync({
                      room_type_id: dayForm.room_type_id,
                      data: dayForm.data,
                      preco: dayForm.preco ? Number(dayForm.preco) : undefined,
                      min_stay: dayForm.min_stay ? Number(dayForm.min_stay) : undefined,
                      stop_sell: dayForm.stop_sell,
                    });
                  }, "Data ajustada (não será sobrescrita pelo gerador)")
                }
              >
                Aplicar
              </Button>
            </CardBody>
          </Card>
        </PainelSection>

        <PainelSection
          title="Política de cancelamento"
          description="Vale para as reservas do bot e do site. Estornos continuam sendo feitos à mão no Asaas."
        >
          <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
            <CardBody className="flex flex-wrap items-end justify-between gap-4 p-6">
              {policy ? (
                <p className="max-w-xl text-sm text-foreground">
                  Remarcação com crédito até <strong>{policy.dias_antecedencia_remarcacao} dias</strong> antes do
                  check-in; depois disso, sem reembolso automático. No-show cobra {policy.taxa_noshow_percent}%.
                </p>
              ) : (
                <p className="max-w-xl text-sm text-foreground/60">
                  Nenhuma política cadastrada — o padrão de 7 dias é aplicado.
                </p>
              )}
              {canManage ? (
                <div className="flex items-end gap-2">
                  <Input
                    className="w-44"
                    label="Dias de antecedência"
                    type="number"
                    value={policyDias}
                    onChange={(e) => setPolicyDias(e.target.value)}
                  />
                  <Button
                    color="primary"
                    onPress={() =>
                      submit(async () => {
                        const dias = Number(policyDias);
                        if (policy) {
                          await updatePolicy.mutateAsync({ id: policy.id, dto: { dias_antecedencia_remarcacao: dias } });
                        } else {
                          await createPolicy.mutateAsync({
                            nome: "Padrão",
                            dias_antecedencia_remarcacao: dias,
                            reembolso_apos_prazo: false,
                            taxa_noshow_percent: 100,
                          });
                        }
                      }, "Política salva")
                    }
                  >
                    Salvar
                  </Button>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </PainelSection>
      </div>

      <ConfirmModal
        confirmColor="danger"
        confirmText="Excluir"
        isOpen={!!deleteTarget}
        message={
          deleteTarget?.kind === "season"
            ? `Excluir a temporada "${deleteTarget.label}"? As regras ligadas a ela deixam de valer e o calendário volta ao preço base.`
            : `Excluir a regra ${deleteTarget?.label ?? ""}? As datas futuras deixam de receber esse preço.`
        }
        title="Confirmar exclusão"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </PainelPageShell>
  );
}
