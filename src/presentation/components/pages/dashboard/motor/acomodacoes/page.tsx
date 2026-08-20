"use client";

import { useState } from "react";
import { Button, Card, CardBody, Chip, Input, Switch } from "@heroui/react";
import { BedDouble, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useTenantCapabilities } from "@/src/modules/settings/presentation/hooks/tenant-capabilities-provider";
import {
  useCreateRoomType,
  useCreateUnit,
  useMotorRoomTypes,
  useUpdateRoomType,
  useUpdateUnit,
} from "@/src/shared/hooks/motor";
import { PainelPageShell } from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { ConfirmModal } from "@/src/presentation/components/organisms/modals/confirm-modal";

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

interface RoomTypeForm {
  nome: string;
  capacidade_base: number;
  aceita_pets: boolean;
  valor_pessoa_adicional: number;
  taxa_pet_dia: number;
}

const EMPTY_FORM: RoomTypeForm = {
  nome: "",
  capacidade_base: 2,
  aceita_pets: false,
  valor_pessoa_adicional: 0,
  taxa_pet_dia: 0,
};

export default function MotorAcomodacoesPage() {
  const { tenantId, hasPermission } = useTenantCapabilities();
  const { data: roomTypes, isLoading, isError } = useMotorRoomTypes(tenantId);
  const createRoomType = useCreateRoomType(tenantId);
  const updateRoomType = useUpdateRoomType(tenantId);
  const createUnit = useCreateUnit(tenantId);
  const updateUnit = useUpdateUnit(tenantId);
  const canManage = hasPermission("motor.settings.manage");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RoomTypeForm>(EMPTY_FORM);
  const [newUnit, setNewUnit] = useState<Record<string, string>>({});
  // Desativar unidade e destrutivo do ponto de vista do calendario: confirma antes.
  const [unitToDisable, setUnitToDisable] = useState<{ id: string; identificador: string } | null>(null);

  async function handleCreate() {
    if (!form.nome.trim()) return toast.error("Informe o nome do tipo");
    try {
      await createRoomType.mutateAsync({
        nome: form.nome,
        capacidade_base: form.capacidade_base,
        // Regra do motor: no maximo 1 pessoa adicional por quarto.
        capacidade_max: form.capacidade_base + 1,
        aceita_pets: form.aceita_pets,
        valor_pessoa_adicional: form.valor_pessoa_adicional,
        taxa_pet_dia: form.taxa_pet_dia,
      });
      toast.success("Tipo de acomodação criado");
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {
      toast.error("Erro ao criar o tipo");
    }
  }

  async function handleAddUnit(roomTypeId: string) {
    const identificador = (newUnit[roomTypeId] ?? "").trim();
    if (!identificador) return toast.error("Informe o identificador da unidade");
    try {
      await createUnit.mutateAsync({ room_type_id: roomTypeId, identificador });
      toast.success("Unidade adicionada");
      setNewUnit((prev) => ({ ...prev, [roomTypeId]: "" }));
    } catch {
      toast.error("Erro ao adicionar a unidade");
    }
  }

  async function handleDisableUnit() {
    if (!unitToDisable) return;
    const { id, identificador } = unitToDisable;
    setUnitToDisable(null);
    try {
      await updateUnit.mutateAsync({ id, dto: { ativo: false } });
      toast.success(`${identificador} desativada`);
    } catch {
      toast.error("Erro ao desativar a unidade");
    }
  }

  return (
    <PainelPageShell
      title="Acomodações"
      description="Os tipos que o bot vende e as unidades que o calendário controla."
      isLoading={isLoading}
      isError={isError}
      errorMessage="Erro ao carregar as acomodações."
      actions={
        canManage ? (
          <Button color="primary" startContent={<Plus className="h-4 w-4" />} onPress={() => setShowForm((v) => !v)}>
            Novo tipo
          </Button>
        ) : undefined
      }
    >
      {showForm ? (
        <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
          <CardBody className="space-y-4 p-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Novo tipo de acomodação</h2>
              <p className="text-sm text-foreground/60">
                O preço vale para as pessoas incluídas; acima disso o motor cobra o adicional por noite.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Input
                label="Nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
              <Input
                label="Pessoas incluídas no preço"
                type="number"
                value={String(form.capacidade_base)}
                onChange={(e) => setForm({ ...form, capacidade_base: Number(e.target.value) || 1 })}
              />
              <Input
                label="Valor por pessoa adicional (noite)"
                type="number"
                value={String(form.valor_pessoa_adicional)}
                onChange={(e) => setForm({ ...form, valor_pessoa_adicional: Number(e.target.value) || 0 })}
              />
              <Input
                label="Taxa de pet por dia"
                type="number"
                value={String(form.taxa_pet_dia)}
                onChange={(e) => setForm({ ...form, taxa_pet_dia: Number(e.target.value) || 0 })}
              />
              <div className="flex items-end gap-4">
                <Switch isSelected={form.aceita_pets} onValueChange={(v) => setForm({ ...form, aceita_pets: v })}>
                  Aceita pets
                </Switch>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button color="primary" isLoading={createRoomType.isPending} onPress={handleCreate}>
                Salvar
              </Button>
              <Button variant="light" onPress={() => setShowForm(false)}>
                Descartar
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {roomTypes && roomTypes.length > 0 ? (
        <div className="space-y-4">
          {roomTypes.map((roomType) => (
            <Card key={roomType.id} className="rounded-3xl border border-border bg-default-50 shadow-none">
              <CardBody className="space-y-5 p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                    >
                      <BedDouble className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-foreground">{roomType.nome}</h2>
                      <p className="text-sm text-foreground/60">
                        {roomType.capacidade_base} + {roomType.capacidade_max - roomType.capacidade_base} pessoas
                        {" · adicional "}
                        {fmtBRL(roomType.valor_pessoa_adicional)}/noite
                        {roomType.aceita_pets ? ` · pet ${fmtBRL(roomType.taxa_pet_dia)}/dia` : " · não aceita pets"}
                      </p>
                    </div>
                  </div>
                  {canManage ? (
                    <Switch
                      isSelected={roomType.ativo}
                      onValueChange={async (ativo) => {
                        await updateRoomType.mutateAsync({ id: roomType.id, dto: { ativo } });
                        toast.success(ativo ? "Tipo reativado" : "Tipo desativado");
                      }}
                    >
                      Ativo
                    </Switch>
                  ) : null}
                </div>
                <div className="space-y-2 border-t border-border pt-5">
                  <p className="text-sm font-medium text-foreground">
                    Unidades <span className="text-foreground/60">({roomType.units.length})</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {roomType.units.length ? (
                      roomType.units.map((unit) => (
                        <Chip
                          key={unit.id}
                          color={unit.ativo ? "primary" : "default"}
                          variant="flat"
                          onClose={
                            canManage && unit.ativo
                              ? () => setUnitToDisable({ id: unit.id, identificador: unit.identificador })
                              : undefined
                          }
                        >
                          {unit.identificador}
                        </Chip>
                      ))
                    ) : (
                      <p className="text-sm text-foreground/60">
                        Sem unidades — o calendário não tem o que reservar neste tipo.
                      </p>
                    )}
                    {canManage ? (
                      <div className="flex items-center gap-2">
                        <Input
                          aria-label={`Nova unidade de ${roomType.nome}`}
                          className="w-40"
                          placeholder="Ex.: Casal 03"
                          size="sm"
                          value={newUnit[roomType.id] ?? ""}
                          onChange={(e) => setNewUnit((prev) => ({ ...prev, [roomType.id]: e.target.value }))}
                        />
                        <Button size="sm" variant="flat" onPress={() => handleAddUnit(roomType.id)}>
                          Adicionar unidade
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <PortalEmptyState
          actionLabel={canManage ? "Criar tipo de acomodação" : undefined}
          description="Cadastre os tipos (ex.: Suíte Casal, Chalé) e as unidades físicas de cada um."
          icon={BedDouble}
          title="Nenhum tipo de acomodação"
          onAction={canManage ? () => setShowForm(true) : undefined}
        />
      )}

      <ConfirmModal
        confirmColor="danger"
        confirmText="Desativar"
        isOpen={!!unitToDisable}
        isLoading={updateUnit.isPending}
        message={`Desativar a unidade "${unitToDisable?.identificador ?? ""}"? Ela sai do calendário e deixa de receber reservas novas. As reservas já feitas continuam valendo.`}
        title="Confirmar desativação"
        onClose={() => setUnitToDisable(null)}
        onConfirm={handleDisableUnit}
      />
    </PainelPageShell>
  );
}
