"use client";
import { useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Switch,
} from "@heroui/react";
import { Bell, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/src/infraestructure/axios/api";
import { CmsPageLayout } from "../cms/shared/cms-page-layout";
import { CmsPageHeader } from "../cms/shared/cms-page-header";
import toast from "react-hot-toast";

interface Props {
  initial?: any;
  id?: string;
}

export function NotificationForm({ initial, id }: Props) {
  const { push } = useRouter();
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    body: initial?.body ?? "",
    type: initial?.type ?? "manual",
    scope: initial?.scope ?? "broadcast",
    tenant_ids: (initial?.tenant_ids ?? []).join(", "),
    send_email: initial?.send_email ?? false,
  });
  const [loading, setLoading] = useState(false);

  const set = (field: string, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        tenant_ids:
          form.scope === "targeted"
            ? form.tenant_ids
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
      };
      if (id) {
        await apiClient.patch(`/notifications/${id}`, payload);
        toast.success("Rascunho atualizado!");
      } else {
        await apiClient.post("/notifications", payload);
        toast.success("Rascunho criado!");
      }
      push("/dashboard/global/notifications");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? err.message ?? "Erro ao salvar",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <CmsPageLayout routeActive="notifications-global">
      <div className="flex items-center gap-2 -mb-2">
        <Button
          as={Link}
          href="/dashboard/global/notifications"
          variant="light"
          size="sm"
          startContent={<ArrowLeft className="w-4 h-4" />}
          className="text-muted-foreground px-0"
        >
          Voltar
        </Button>
      </div>

      <CmsPageHeader
        title={id ? "Editar notificação" : "Nova notificação"}
        description={
          id
            ? "Edite o conteúdo do rascunho antes de publicar."
            : "Crie um rascunho e publique quando estiver pronto."
        }
        icon={<Bell className="w-6 h-6" />}
      />

      <form onSubmit={submit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Conteúdo principal */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Card className="border border-border shadow-none">
              <CardHeader className="px-5 pt-5 pb-0">
                <h2 className="text-sm font-semibold text-foreground">
                  Conteúdo
                </h2>
              </CardHeader>
              <CardBody className="flex flex-col gap-4 px-5 pb-5">
                <Input
                  label="Título"
                  placeholder="Título da notificação"
                  value={form.title}
                  onValueChange={(v) => set("title", v)}
                  isRequired
                  maxLength={255}
                  description={`${form.title.length}/255 caracteres`}
                />
                <Textarea
                  label="Corpo"
                  placeholder="Escreva o conteúdo da notificação..."
                  value={form.body}
                  onValueChange={(v) => set("body", v)}
                  isRequired
                  minRows={5}
                />
              </CardBody>
            </Card>
          </div>

          {/* Configurações */}
          <div className="flex flex-col gap-4">
            <Card className="border border-border shadow-none">
              <CardHeader className="px-5 pt-5 pb-0">
                <h2 className="text-sm font-semibold text-foreground">
                  Configurações
                </h2>
              </CardHeader>
              <CardBody className="flex flex-col gap-4 px-5 pb-5">
                <Select
                  label="Escopo"
                  selectedKeys={[form.scope]}
                  onSelectionChange={(keys) =>
                    set("scope", Array.from(keys)[0] as string)
                  }
                >
                  <SelectItem key="broadcast">
                    Broadcast — todos os tenants
                  </SelectItem>
                  <SelectItem key="targeted">Segmentado</SelectItem>
                </Select>

                {form.scope === "targeted" && (
                  <Input
                    label="IDs dos tenants"
                    placeholder="id1, id2, id3..."
                    value={form.tenant_ids}
                    onValueChange={(v) => set("tenant_ids", v)}
                    description="Separe os IDs por vírgula"
                  />
                )}

                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      Enviar por email
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Entrega também via email
                    </span>
                  </div>
                  <Switch
                    isSelected={form.send_email}
                    onValueChange={(v) => set("send_email", v)}
                    size="sm"
                    color="primary"
                  />
                </div>
              </CardBody>
            </Card>

            <Button
              type="submit"
              color="primary"
              isLoading={loading}
              startContent={!loading && <Save className="w-4 h-4" />}
              className="w-full font-medium shadow-sm"
            >
              {loading ? "Salvando..." : "Salvar rascunho"}
            </Button>
          </div>
        </div>
      </form>
    </CmsPageLayout>
  );
}
