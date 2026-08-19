"use client";

import { useState } from "react";
import { Button, Card, CardBody, Checkbox, Input, Select, SelectItem } from "@heroui/react";
import toast from "react-hot-toast";
import { useBulkDailyInventory, useMotorRoomTypes } from "@/src/shared/hooks/motor";
import { ConfirmModal } from "@/src/presentation/components/organisms/modals/confirm-modal";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { DOW_OPTIONS } from "@/src/presentation/components/organisms/motor/dow";
import type { BulkMotorDailyInventoryDto, MotorBulkResumo } from "@/src/shared/domain/types/@motor";

interface BulkUpdateFormProps {
  tenantId: string;
  canManage: boolean;
}

// Tri-estado: "unset" mantem o valor atual (nao alterar), "true"/"false" sobrescrevem.
const TRI_STATE_UNSET = "unset";

const STOP_SELL_OPTIONS = [
  { key: TRI_STATE_UNSET, label: "— não alterar —" },
  { key: "true", label: "Fechar venda" },
  { key: "false", label: "Abrir venda" },
];

const CLOSED_ARRIVAL_OPTIONS = [
  { key: TRI_STATE_UNSET, label: "— não alterar —" },
  { key: "true", label: "Bloquear chegada" },
  { key: "false", label: "Permitir chegada" },
];

const CLOSED_DEPARTURE_OPTIONS = [
  { key: TRI_STATE_UNSET, label: "— não alterar —" },
  { key: "true", label: "Bloquear saída" },
  { key: "false", label: "Permitir saída" },
];

function triStateToBoolean(value: string): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function BulkUpdateForm({ tenantId, canManage }: BulkUpdateFormProps) {
  const { data: roomTypes } = useMotorRoomTypes(tenantId);
  const bulkUpdate = useBulkDailyInventory(tenantId);

  const [roomTypeIds, setRoomTypeIds] = useState<Set<string>>(new Set());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dowMask, setDowMask] = useState(127);
  const [preco, setPreco] = useState("");
  const [minStay, setMinStay] = useState("");
  const [stopSell, setStopSell] = useState(TRI_STATE_UNSET);
  const [closedArrival, setClosedArrival] = useState(TRI_STATE_UNSET);
  const [closedDeparture, setClosedDeparture] = useState(TRI_STATE_UNSET);
  const [resumo, setResumo] = useState<MotorBulkResumo | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (!canManage) {
    return (
      <PortalEmptyState
        title="Sem permissão"
        description="Você não tem permissao para editar tarifas."
      />
    );
  }

  // Qualquer alteracao no formulario invalida o preview — o preview
  // e obrigatorio antes de aplicar, entao voltamos resumo pra null.
  function withReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setResumo(null);
      setter(value);
    };
  }

  const setFromReset = withReset(setFrom);
  const setToReset = withReset(setTo);
  const setPrecoReset = withReset(setPreco);
  const setMinStayReset = withReset(setMinStay);
  const setStopSellReset = withReset(setStopSell);
  const setClosedArrivalReset = withReset(setClosedArrival);
  const setClosedDepartureReset = withReset(setClosedDeparture);

  function toggleRoomType(id: string, checked: boolean) {
    setResumo(null);
    setRoomTypeIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleDow(bit: number, checked: boolean) {
    setResumo(null);
    setDowMask((prev) => (checked ? prev | bit : prev & ~bit));
  }

  function toggleAllRoomTypes() {
    setResumo(null);
    const allIds = (roomTypes ?? []).map((rt) => rt.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => roomTypeIds.has(id));
    setRoomTypeIds(allSelected ? new Set() : new Set(allIds));
  }

  function buildDto(): BulkMotorDailyInventoryDto {
    return {
      room_type_ids: Array.from(roomTypeIds),
      from,
      to,
      dow_mask: dowMask,
      preco: preco.trim() === "" ? undefined : Number(preco),
      min_stay: minStay.trim() === "" ? undefined : Number(minStay),
      stop_sell: triStateToBoolean(stopSell),
      closed_arrival: triStateToBoolean(closedArrival),
      closed_departure: triStateToBoolean(closedDeparture),
    };
  }

  async function handlePreview() {
    try {
      const result = await bulkUpdate.mutateAsync({ ...buildDto(), dry_run: true });
      setResumo(result);
    } catch {
      toast.error("Não foi possível pré-visualizar a atualização");
    }
  }

  async function handleApply() {
    try {
      await bulkUpdate.mutateAsync(buildDto());
      toast.success("Atualização em massa aplicada");
      setResumo(null);
      setIsConfirmOpen(false);
    } catch {
      toast.error("Não foi possível aplicar a atualização");
      setIsConfirmOpen(false);
    }
  }

  const allSelected =
    (roomTypes ?? []).length > 0 && (roomTypes ?? []).every((rt) => roomTypeIds.has(rt.id));

  return (
    <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
      <CardBody className="space-y-6 p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Acomodações</p>
            <Button size="sm" variant="light" onPress={toggleAllRoomTypes}>
              {allSelected ? "Desmarcar" : "Marcar todos"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            {(roomTypes ?? []).map((rt) => (
              <Checkbox
                key={rt.id}
                isSelected={roomTypeIds.has(rt.id)}
                onValueChange={(checked) => toggleRoomType(rt.id, checked)}
              >
                {rt.nome}
              </Checkbox>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Início" type="date" value={from} onChange={(e) => setFromReset(e.target.value)} />
          <Input label="Fim" type="date" value={to} onChange={(e) => setToReset(e.target.value)} />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Dias da semana</p>
          <div className="flex flex-wrap items-center gap-2">
            {DOW_OPTIONS.map((d) => (
              <Checkbox
                key={d.bit}
                isSelected={(dowMask & d.bit) !== 0}
                size="sm"
                onValueChange={(checked) => toggleDow(d.bit, checked)}
              >
                {d.label}
              </Checkbox>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            label="Preco/noite (opcional)"
            type="number"
            value={preco}
            onChange={(e) => setPrecoReset(e.target.value)}
          />
          <Input
            label="Mín. noites (opcional)"
            type="number"
            value={minStay}
            onChange={(e) => setMinStayReset(e.target.value)}
          />
          <Select
            label="Fechar/abrir venda"
            selectedKeys={[stopSell]}
            onChange={(e) => setStopSellReset(e.target.value)}
          >
            {STOP_SELL_OPTIONS.map((opt) => (
              <SelectItem key={opt.key}>{opt.label}</SelectItem>
            ))}
          </Select>
          <Select
            label="Chegada"
            selectedKeys={[closedArrival]}
            onChange={(e) => setClosedArrivalReset(e.target.value)}
          >
            {CLOSED_ARRIVAL_OPTIONS.map((opt) => (
              <SelectItem key={opt.key}>{opt.label}</SelectItem>
            ))}
          </Select>
          <Select
            label="Saída"
            selectedKeys={[closedDeparture]}
            onChange={(e) => setClosedDepartureReset(e.target.value)}
          >
            {CLOSED_DEPARTURE_OPTIONS.map((opt) => (
              <SelectItem key={opt.key}>{opt.label}</SelectItem>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button color="default" isLoading={bulkUpdate.isPending} onPress={handlePreview}>
            Pre-visualizar
          </Button>
          <Button color="primary" isDisabled={!resumo} onPress={() => setIsConfirmOpen(true)}>
            Aplicar
          </Button>
        </div>

        {resumo ? (
          <p className="rounded-xl bg-default-100 px-4 py-3 text-sm text-foreground">
            {resumo.atualizar} datas atualizadas · {resumo.criar} criadas · {resumo.ignoradas_sem_preco} ignoradas
            (sem preço base — informe um preço para criá-las)
          </p>
        ) : null}
      </CardBody>

      <ConfirmModal
        isOpen={isConfirmOpen}
        isLoading={bulkUpdate.isPending}
        title="Aplicar atualização em massa"
        message={`Aplicar alterações em ${resumo?.total_datas ?? 0} datas? Esta ação grava overrides.`}
        confirmText="Aplicar"
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleApply}
      />
    </Card>
  );
}
