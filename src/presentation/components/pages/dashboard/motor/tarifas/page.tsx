"use client";

import { useState } from "react";
import { Button, Card, CardBody, Checkbox, Input, Select, SelectItem } from "@heroui/react";
import { Trash2 } from "lucide-react";
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
import { DOW_OPTIONS, dowLabel } from "@/src/presentation/components/organisms/motor/dow";

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

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

  const policy = data?.policies[0];

  return (
    <PainelPageShell
      title="Tarifas"
      description="Temporadas, preços por dia da semana, mínimo de noites e política de cancelamento."
      isLoading={isLoading}
      isError={isError}
      errorMessage="Erro ao carregar as tarifas."
    >
      <div className="space-y-10">
        <PainelSection title="Temporadas">
          <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
            <CardBody className="space-y-4 p-6">
              {data?.seasons.length ? (
                <ul className="space-y-2">
                  {data.seasons.map((season) => (
                    <li key={season.id} className="flex items-center justify-between rounded-xl bg-default-100 px-4 py-2 text-sm">
                      <span>
                        <strong>{season.nome}</strong> · {season.data_inicio} → {season.data_fim} · prioridade {season.prioridade}
                      </span>
                      {canManage ? (
                        <Button
                          isIconOnly
                          aria-label={`Excluir ${season.nome}`}
                          size="sm"
                          variant="light"
                          onPress={() => submit(() => deleteSeason.mutateAsync(season.id), "Temporada excluída")}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma temporada — vale a regra base o ano todo.</p>
              )}
              {canManage ? (
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
              ) : null}
            </CardBody>
          </Card>
        </PainelSection>

        <PainelSection title="Regras de preço">
          <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
            <CardBody className="space-y-4 p-6">
              {data?.price_rules.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2 pr-4">Acomodação</th>
                        <th className="py-2 pr-4">Temporada</th>
                        <th className="py-2 pr-4">Dias</th>
                        <th className="py-2 pr-4">Preço/noite</th>
                        <th className="py-2 pr-4">Mín. noites</th>
                        <th className="py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.price_rules.map((rule) => (
                        <tr key={rule.id} className="border-t border-border">
                          <td className="py-2 pr-4">{roomTypeName(rule.room_type_id)}</td>
                          <td className="py-2 pr-4">{seasonName(rule.season_id)}</td>
                          <td className="py-2 pr-4">{dowLabel(rule.dow_mask)}</td>
                          <td className="py-2 pr-4">{fmtBRL(rule.preco_noite)}</td>
                          <td className="py-2 pr-4">{rule.min_stay}</td>
                          <td className="py-2">
                            {canManage ? (
                              <Button
                                isIconOnly
                                aria-label="Excluir regra"
                                size="sm"
                                variant="light"
                                onPress={() => submit(() => deleteRule.mutateAsync(rule.id), "Regra excluída")}
                              >
                                <Trash2 className="h-4 w-4 text-danger" />
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma regra — o calendário fica sem preço (não vendável).</p>
              )}
              {canManage ? (
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
                    {(data?.seasons ?? []).map((s) => (
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
              ) : null}
            </CardBody>
          </Card>
        </PainelSection>

        <PainelSection title="Edição pontual de data">
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

        <PainelSection title="Política de cancelamento">
          <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
            <CardBody className="flex flex-wrap items-end gap-4 p-6">
              {policy ? (
                <p className="text-sm text-foreground">
                  Remarcação com crédito até <strong>{policy.dias_antecedencia_remarcacao} dias</strong> antes do
                  check-in; depois disso, sem reembolso automático. No-show cobra {policy.taxa_noshow_percent}%.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma política cadastrada — o padrão de 7 dias é aplicado.</p>
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
    </PainelPageShell>
  );
}
