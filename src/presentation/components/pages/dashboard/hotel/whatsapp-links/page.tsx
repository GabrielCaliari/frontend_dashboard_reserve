"use client";

import { useState, useEffect } from "react";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import {
  useActiveHotelClient,
  useWhatsAppLinks,
  useWhatsAppLinkStats,
  useCreateWhatsAppLink,
  useUpdateWhatsAppLink,
  useDeleteWhatsAppLink,
} from "@/src/shared/hooks/hotel-portal";
import usePermissions from "@/src/shared/hooks/use-permissions";
import { useTenantStore } from "@/src/shared/stores/tenant-store";
import {
  Card,
  CardBody,
  Spinner,
  Chip,
  Button,
  Input,
} from "@heroui/react";
import {
  AlertCircle,
  Link2,
  Copy,
  MousePointer,
  Smartphone,
  Monitor,
  Tablet,
  Pencil,
  Trash2,
  X,
  Plus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import toast from "react-hot-toast";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}

const CUSTOM_CODE_RE = /^[a-zA-Z0-9_-]{3,50}$/;

/** Returns an error message if the custom code is invalid, or null if valid/empty. */
function validateCustomCode(code: string): string | null {
  if (!code) return null;
  if (!CUSTOM_CODE_RE.test(code))
    return "Link personalizado inválido: use 3 a 50 caracteres (letras, números, - ou _).";
  return null;
}

const DEVICE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#a855f7"];
const COUNTRY_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#f97316", "#84cc16"];

function LinkStatsPanel({ clientId, linkId }: { clientId: string; linkId: string }) {
  const { data: stats, isLoading } = useWhatsAppLinkStats(clientId, linkId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="md" color="primary" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-5 pt-4 border-t border-primary/20">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-primary/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{fmt(stats.total_clicks)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total de Cliques</p>
        </div>
        <div className="bg-default-100 rounded-2xl p-4 text-center">
          <p className="text-lg font-bold text-foreground capitalize">{stats.by_device?.[0]?.device ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Dispositivo Principal</p>
        </div>
        <div className="bg-default-100 rounded-2xl p-4 text-center">
          <p className="text-lg font-bold text-foreground">{stats.by_country?.[0]?.country || "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">País Principal</p>
        </div>
      </div>

      {(stats.clicks_by_day?.length ?? 0) > 0 && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Cliques por dia — últimos 30 dias</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={stats.clicks_by_day.map((d) => ({ date: d.date.slice(5), cliques: d.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="cliques" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {(stats.by_device?.length ?? 0) > 0 && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Por Dispositivo</p>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={stats.by_device.map((d) => ({ name: d.device, value: d.count }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={55}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {stats.by_device.map((_, i) => (
                    <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {(stats.by_country?.length ?? 0) > 0 && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Top Países</p>
            <div className="space-y-2">
              {stats.by_country.slice(0, 6).map((c, i) => {
                const pct = stats.total_clicks > 0 ? (c.count / stats.total_clicks) * 100 : 0;
                return (
                  <div key={c.country}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{c.country || "Desconhecido"}</span>
                      <span className="font-medium text-foreground">{c.count}</span>
                    </div>
                    <div className="h-1.5 bg-default-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%`, background: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {(stats.by_region?.length ?? 0) > 0 && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Top Regiões</p>
            <div className="space-y-2">
              {stats.by_region.slice(0, 6).map((r, i) => {
                const pct = stats.total_clicks > 0 ? (r.count / stats.total_clicks) * 100 : 0;
                return (
                  <div key={r.region}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{r.region || "Desconhecida"}</span>
                      <span className="font-medium text-foreground">{r.count}</span>
                    </div>
                    <div className="h-1.5 bg-default-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%`, background: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(stats.by_city?.length ?? 0) > 0 && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Top Cidades</p>
            <div className="space-y-2">
              {stats.by_city.slice(0, 6).map((c, i) => {
                const pct = stats.total_clicks > 0 ? (c.count / stats.total_clicks) * 100 : 0;
                const label = !c.city || c.city.toLowerCase() === "unknown" ? "Desconhecida" : c.city;
                return (
                  <div key={c.city}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">{c.count}</span>
                    </div>
                    <div className="h-1.5 bg-default-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%`, background: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HotelWhatsAppLinksPage() {
  const { isSuperAdmin } = usePermissions();
  const selectedTenant = useTenantStore((s) => s.selectedTenant);
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const { data: links, isLoading } = useWhatsAppLinks(client?.id ?? null);

  const { mutateAsync: create, isPending: creating } = useCreateWhatsAppLink(client?.id ?? "");
  const { mutateAsync: update, isPending: updating } = useUpdateWhatsAppLink(client?.id ?? "");
  const { mutateAsync: del, isPending: deleting } = useDeleteWhatsAppLink(client?.id ?? "");

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone_number: "", message: "", custom_code: "", utm_source: "", utm_medium: "", utm_campaign: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", message: "", custom_code: "", utm_source: "", utm_medium: "", utm_campaign: "" });

  const setF = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));
  const setEF = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditForm((p) => ({ ...p, [f]: e.target.value }));

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => toast.success("URL copiada!"));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!client) return;
    const codeError = validateCustomCode(form.custom_code.trim());
    if (codeError) {
      toast.error(codeError);
      return;
    }
    try {
      await create({
        name: form.name,
        phone_number: form.phone_number,
        message: form.message || undefined,
        custom_code: form.custom_code.trim() || undefined,
        utm_source: form.utm_source || undefined,
        utm_medium: form.utm_medium || undefined,
        utm_campaign: form.utm_campaign || undefined,
      });
      toast.success("Link criado!");
      setForm({ name: "", phone_number: "", message: "", custom_code: "", utm_source: "", utm_medium: "", utm_campaign: "" });
      setShowForm(false);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error("Esse link já está em uso, escolha outro.");
        return;
      }
      const msg = err?.response?.data?.message ?? err?.message ?? "Erro desconhecido";
      toast.error(`Erro ao criar link: ${msg}`);
      console.error("[createWhatsAppLink]", err?.response?.data ?? err);
    }
  }

  function startEdit(link: { id: string; name: string; message?: string; code?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string }) {
    setEditingId(link.id);
    setEditForm({
      name: link.name,
      message: link.message ?? "",
      custom_code: link.code ?? "",
      utm_source: link.utm_source ?? "",
      utm_medium: link.utm_medium ?? "",
      utm_campaign: link.utm_campaign ?? "",
    });
    setExpandedId(null);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const codeError = validateCustomCode(editForm.custom_code.trim());
    if (codeError) {
      toast.error(codeError);
      return;
    }
    try {
      await update({
        id: editingId,
        data: {
          name: editForm.name,
          message: editForm.message || undefined,
          custom_code: editForm.custom_code.trim() || undefined,
          utm_source: editForm.utm_source || undefined,
          utm_medium: editForm.utm_medium || undefined,
          utm_campaign: editForm.utm_campaign || undefined,
        },
      });
      toast.success("Link atualizado!");
      setEditingId(null);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error("Esse link já está em uso, escolha outro.");
        return;
      }
      toast.error("Erro ao atualizar.");
    }
  }

  async function handleToggle(id: string, is_active: boolean) {
    try {
      await update({ id, data: { is_active: !is_active } });
    } catch {
      toast.error("Erro ao alterar status.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await del(id);
      toast.success("Link removido.");
      if (expandedId === id) setExpandedId(null);
    } catch {
      toast.error("Erro ao remover link.");
    }
  }

  if (!mounted || clientLoading || isLoading) {
    return (
      <LayoutScopeRoot>
        <div className="flex justify-center items-center py-32">
          <Spinner size="lg" color="primary" />
        </div>
      </LayoutScopeRoot>
    );
  }

  if (isSuperAdmin && !selectedTenant) {
    return (
      <LayoutScopeRoot>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
          <p className="text-foreground font-semibold">Selecione um tenant</p>
          <p className="text-sm text-muted-foreground mt-1">
            Escolha um tenant no seletor acima para gerenciar os links de WhatsApp do hotel.
          </p>
        </div>
      </LayoutScopeRoot>
    );
  }

  if (!client) {
    return (
      <LayoutScopeRoot>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
          <p className="text-foreground font-medium">Nenhum hotel associado a esta conta.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Este tenant não possui um portal de hotel configurado.
          </p>
        </div>
      </LayoutScopeRoot>
    );
  }

  const canManage = isSuperAdmin;

  return (
    <LayoutScopeRoot>
      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-8 space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Links WhatsApp</h1>
              <p className="text-sm text-muted-foreground">
                {client.hotel_name} — links rastreáveis de atendimento
              </p>
            </div>
          </div>
          {canManage && (
            <Button
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => { setShowForm(!showForm); setEditingId(null); }}
              className="font-medium"
            >
              Novo Link
            </Button>
          )}
        </div>

        {/* Create form */}
        {canManage && showForm && (
          <Card className="bg-default-50 border border-border rounded-3xl shadow-none">
            <CardBody className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">Criar novo link rastreável</p>
                <Button isIconOnly size="sm" variant="flat" onPress={() => setShowForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nome (ex: Recepção, Reservas)"
                    value={form.name}
                    onChange={setF("name")}
                    isRequired
                    variant="bordered"
                    classNames={{ inputWrapper: "rounded-2xl border-border" }}
                  />
                  <Input
                    label="Número WhatsApp (ex: 5511999999999)"
                    value={form.phone_number}
                    onChange={setF("phone_number")}
                    isRequired
                    variant="bordered"
                    classNames={{ inputWrapper: "rounded-2xl border-border" }}
                    description="DDI + DDD + número, sem espaços ou símbolos"
                  />
                </div>
                <Input
                  label="Mensagem pré-preenchida (opcional)"
                  value={form.message}
                  onChange={setF("message")}
                  variant="bordered"
                  classNames={{ inputWrapper: "rounded-2xl border-border" }}
                  placeholder="Olá, gostaria de fazer uma reserva..."
                />
                <Input
                  label="Link personalizado (opcional)"
                  value={form.custom_code}
                  onChange={setF("custom_code")}
                  variant="bordered"
                  classNames={{ inputWrapper: "rounded-2xl border-border" }}
                  placeholder="atendimento-caliari"
                  description="Final do link (/wa/...). 3 a 50 caracteres: letras, números, - ou _. Vazio = gerado pelo nome."
                  startContent={<span className="text-xs text-muted-foreground">/wa/</span>}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="UTM Source (opcional)"
                    value={form.utm_source}
                    onChange={setF("utm_source")}
                    variant="bordered"
                    classNames={{ inputWrapper: "rounded-2xl border-border" }}
                    placeholder="instagram"
                  />
                  <Input
                    label="UTM Medium (opcional)"
                    value={form.utm_medium}
                    onChange={setF("utm_medium")}
                    variant="bordered"
                    classNames={{ inputWrapper: "rounded-2xl border-border" }}
                    placeholder="social"
                  />
                  <Input
                    label="UTM Campaign (opcional)"
                    value={form.utm_campaign}
                    onChange={setF("utm_campaign")}
                    variant="bordered"
                    classNames={{ inputWrapper: "rounded-2xl border-border" }}
                    placeholder="junho2026"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="flat" onPress={() => setShowForm(false)}>Cancelar</Button>
                  <Button type="submit" color="primary" isLoading={creating} className="font-medium">
                    Gerar Link
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Edit form */}
        {canManage && editingId && (
          <Card className="bg-warning/5 border border-warning/30 rounded-3xl shadow-none">
            <CardBody className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">Editar link</p>
                <Button isIconOnly size="sm" variant="flat" onPress={() => setEditingId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleEdit} className="space-y-4">
                <Input
                  label="Nome"
                  value={editForm.name}
                  onChange={setEF("name")}
                  isRequired
                  variant="bordered"
                  classNames={{ inputWrapper: "rounded-2xl border-border" }}
                />
                <Input
                  label="Mensagem pré-preenchida"
                  value={editForm.message}
                  onChange={setEF("message")}
                  variant="bordered"
                  classNames={{ inputWrapper: "rounded-2xl border-border" }}
                />
                <Input
                  label="Link personalizado"
                  value={editForm.custom_code}
                  onChange={setEF("custom_code")}
                  variant="bordered"
                  classNames={{ inputWrapper: "rounded-2xl border-border" }}
                  placeholder="atendimento-caliari"
                  description="3 a 50 caracteres: letras, números, - ou _."
                  startContent={<span className="text-xs text-muted-foreground">/wa/</span>}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="UTM Source"
                    value={editForm.utm_source}
                    onChange={setEF("utm_source")}
                    variant="bordered"
                    classNames={{ inputWrapper: "rounded-2xl border-border" }}
                  />
                  <Input
                    label="UTM Medium"
                    value={editForm.utm_medium}
                    onChange={setEF("utm_medium")}
                    variant="bordered"
                    classNames={{ inputWrapper: "rounded-2xl border-border" }}
                  />
                  <Input
                    label="UTM Campaign"
                    value={editForm.utm_campaign}
                    onChange={setEF("utm_campaign")}
                    variant="bordered"
                    classNames={{ inputWrapper: "rounded-2xl border-border" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  O número de WhatsApp não pode ser alterado após a criação. Crie um novo link para outro número.
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="flat" onPress={() => setEditingId(null)}>Cancelar</Button>
                  <Button type="submit" color="primary" isLoading={updating} className="font-medium">Salvar</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Links list */}
        {!links || links.length === 0 ? (
          <Card className="border-border bg-default-50 shadow-none border-dashed rounded-3xl">
            <CardBody className="flex flex-col items-center justify-center py-20 text-center">
              <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-foreground font-medium">Nenhum link criado ainda</p>
              {canManage && (
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em "Novo Link" para criar o primeiro link rastreável.
                </p>
              )}
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {links.length} {links.length === 1 ? "link" : "links"} criados
            </p>
            {links.map((link) => (
              <Card
                key={link.id}
                className={`border rounded-2xl shadow-none transition-colors ${
                  expandedId === link.id
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-default-50"
                }`}
              >
                <CardBody className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === link.id ? null : link.id)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{link.name}</p>
                        <Chip size="sm" variant="flat" color={link.is_active ? "success" : "default"}>
                          {link.is_active ? "Ativo" : "Inativo"}
                        </Chip>
                        <Chip size="sm" variant="flat" color="primary">
                          <MousePointer className="h-3 w-3 mr-1 inline" />
                          {fmt(link.total_clicks)} cliques
                        </Chip>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate font-mono">
                        {link.short_url}
                      </p>
                      {link.message && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5 truncate italic">
                          "{link.message}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      <Button
                        size="sm"
                        variant="flat"
                        startContent={<Copy className="h-3.5 w-3.5" />}
                        onPress={() => copyUrl(link.short_url)}
                      >
                        Copiar
                      </Button>
                      <Button
                        size="sm"
                        variant={expandedId === link.id ? "solid" : "bordered"}
                        color="primary"
                        onPress={() => setExpandedId(expandedId === link.id ? null : link.id)}
                      >
                        {expandedId === link.id ? "Fechar" : "Stats"}
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            size="sm"
                            variant="flat"
                            isIconOnly
                            onPress={() => startEdit(link)}
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color={link.is_active ? "warning" : "success"}
                            onPress={() => handleToggle(link.id, link.is_active)}
                            isLoading={updating}
                            className="text-xs"
                          >
                            {link.is_active ? "Pausar" : "Ativar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            isIconOnly
                            onPress={() => handleDelete(link.id)}
                            isLoading={deleting}
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {expandedId === link.id && (
                    <LinkStatsPanel clientId={client.id} linkId={link.id} />
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </LayoutScopeRoot>
  );
}
