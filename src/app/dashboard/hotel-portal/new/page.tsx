"use client";

import { useState } from "react";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { useCreateHotelClient } from "@/src/common/hooks/hotel-portal";
import { useRouter } from "nextjs-toploader/app";
import { Card, CardBody, Button, Input } from "@heroui/react";
import { ArrowLeft, Building2 } from "lucide-react";
import toast from "react-hot-toast";

export default function NewHotelClientPage() {
  const { push } = useRouter();
  const { mutateAsync, isPending } = useCreateHotelClient();

  const [form, setForm] = useState({
    email: "",
    password: "",
    hotel_name: "",
    country: "",
    booking_engine: "",
    logo_url: "",
    target_occupancy: "70",
    target_direct_pct: "50",
    contract_start: new Date().toISOString().split("T")[0],
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const client = await mutateAsync({
        email: form.email,
        password: form.password || undefined,
        hotel_name: form.hotel_name,
        country: form.country,
        booking_engine: form.booking_engine || undefined,
        logo_url: form.logo_url || undefined,
        target_occupancy: parseFloat(form.target_occupancy) / 100,
        target_direct_pct: parseFloat(form.target_direct_pct) / 100,
        contract_start: new Date(form.contract_start).toISOString(),
      });
      toast.success("Cliente criado com sucesso!");
      push(`/dashboard/hotel-portal/${client.id}`);
    } catch {
      toast.error(
        "Erro ao criar cliente. Verifique os dados e tente novamente.",
      );
    }
  }

  return (
    <LayoutScopeRoot routeActive="hotel-portal">
      <div className="mx-auto space-y-8 px-4 py-8 sm:px-8 lg:px-10 max-w-[860px] animate-fade-in">
        <div className="flex items-center gap-4">
          <Button
            variant="flat"
            isIconOnly
            onPress={() => push("/dashboard/hotel-portal")}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Novo Cliente
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Cadastre um novo hotel no portal RÉSERVE.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
            <CardBody className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-base font-semibold text-foreground">
                  Dados do Hotel
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nome do Hotel"
                  placeholder="Ex: Hotel Fasano"
                  value={form.hotel_name}
                  onChange={set("hotel_name")}
                  isRequired
                  variant="bordered"
                  classNames={{ inputWrapper: "rounded-2xl border-border" }}
                />
                <Input
                  label="País"
                  placeholder="Ex: Brasil"
                  value={form.country}
                  onChange={set("country")}
                  isRequired
                  variant="bordered"
                  classNames={{ inputWrapper: "rounded-2xl border-border" }}
                />
                <Input
                  label="Motor de Reservas"
                  placeholder="Ex: Omnibees, SkyBeds"
                  value={form.booking_engine}
                  onChange={set("booking_engine")}
                  variant="bordered"
                  classNames={{ inputWrapper: "rounded-2xl border-border" }}
                />
                <Input
                  label="URL do Logo"
                  placeholder="https://..."
                  value={form.logo_url}
                  onChange={set("logo_url")}
                  variant="bordered"
                  classNames={{ inputWrapper: "rounded-2xl border-border" }}
                />
                <Input
                  label="Meta de Ocupação (%)"
                  type="number"
                  min="0"
                  max="100"
                  value={form.target_occupancy}
                  onChange={set("target_occupancy")}
                  isRequired
                  variant="bordered"
                  classNames={{ inputWrapper: "rounded-2xl border-border" }}
                />
                <Input
                  label="Meta de Reserva Direta (%)"
                  type="number"
                  min="0"
                  max="100"
                  value={form.target_direct_pct}
                  onChange={set("target_direct_pct")}
                  isRequired
                  variant="bordered"
                  classNames={{ inputWrapper: "rounded-2xl border-border" }}
                />
                <Input
                  label="Início do Contrato"
                  type="date"
                  value={form.contract_start}
                  onChange={set("contract_start")}
                  isRequired
                  variant="bordered"
                  classNames={{ inputWrapper: "rounded-2xl border-border" }}
                  className="sm:col-span-2"
                />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
            <CardBody className="p-6 sm:p-8 space-y-6">
              <h2 className="text-base font-semibold text-foreground">
                Acesso do Cliente
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="cliente@hotel.com"
                  value={form.email}
                  onChange={set("email")}
                  isRequired
                  variant="bordered"
                  classNames={{ inputWrapper: "rounded-2xl border-border" }}
                />
                <Input
                  label="Senha inicial"
                  type="password"
                  placeholder="Deixe em branco para gerar automaticamente"
                  value={form.password}
                  onChange={set("password")}
                  variant="bordered"
                  classNames={{ inputWrapper: "rounded-2xl border-border" }}
                />
              </div>
            </CardBody>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button
              variant="flat"
              onPress={() => push("/dashboard/hotel-portal")}
              className="font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              color="primary"
              isLoading={isPending}
              className="font-medium"
            >
              Criar Cliente
            </Button>
          </div>
        </form>
      </div>
    </LayoutScopeRoot>
  );
}
