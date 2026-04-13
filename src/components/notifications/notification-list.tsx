"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Pagination,
  Skeleton,
  Tooltip,
} from "@heroui/react";
import { Bell, Plus, Send, Pencil, Trash2, Globe, Target } from "lucide-react";
import { useNotifications } from "@/src/common/hooks/notifications/use-notifications";
import { apiClient } from "@/src/infraestructure/axios/api";
import { CmsPageLayout } from "../cms/shared/cms-page-layout";
import { CmsPageHeader } from "../cms/shared/cms-page-header";
import toast from "react-hot-toast";

const COLUMNS = [
  { key: "title", label: "Título" },
  { key: "type", label: "Tipo" },
  { key: "scope", label: "Escopo" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Criado em" },
  { key: "actions", label: "" },
];

const TYPE_LABELS: Record<string, string> = {
  manual: "Manual",
  event: "Evento",
  scheduled: "Agendado",
};

const TYPE_COLORS: Record<string, "primary" | "secondary" | "warning"> = {
  manual: "primary",
  event: "secondary",
  scheduled: "warning",
};

export function NotificationList() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, total, loading, refetch } = useNotifications({ page, limit });

  const totalPages = Math.ceil(total / limit);

  const publish = async (id: string) => {
    try {
      await apiClient.post(`/notifications/${id}/publish`);
      toast.success("Notificação publicada com sucesso!");
      refetch();
    } catch {
      toast.error("Erro ao publicar notificação.");
    }
  };

  const remove = async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      toast.success("Rascunho excluído.");
      refetch();
    } catch {
      toast.error("Erro ao excluir notificação.");
    }
  };

  const renderCell = (n: any, key: string) => {
    switch (key) {
      case "title":
        return (
          <div className="flex flex-col gap-0.5 max-w-xs">
            <span className="font-medium text-foreground truncate">
              {n.title}
            </span>
            {n.body && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {n.body}
              </span>
            )}
          </div>
        );
      case "type":
        return (
          <Chip
            size="sm"
            variant="flat"
            color={TYPE_COLORS[n.type] ?? "default"}
          >
            {TYPE_LABELS[n.type] ?? n.type}
          </Chip>
        );
      case "scope":
        return (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {n.scope === "broadcast" ? (
              <Globe className="w-3.5 h-3.5" />
            ) : (
              <Target className="w-3.5 h-3.5" />
            )}
            <span className="capitalize">
              {n.scope === "broadcast" ? "Broadcast" : "Segmentado"}
            </span>
          </div>
        );
      case "status":
        return n.published_at ? (
          <Chip size="sm" variant="flat" color="success">
            Publicado
          </Chip>
        ) : (
          <Chip size="sm" variant="flat" color="warning">
            Rascunho
          </Chip>
        );
      case "created_at":
        return (
          <span className="text-xs text-muted-foreground">
            {new Date(n.created_at).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        );
      case "actions":
        if (n.published_at) return null;
        return (
          <div className="flex items-center gap-1 justify-end">
            <Tooltip content="Publicar">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="success"
                onPress={() => publish(n.id)}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </Tooltip>
            <Tooltip content="Editar">
              <Button
                as={Link}
                href={`/dashboard/global/notifications/${n.id}`}
                isIconOnly
                size="sm"
                variant="light"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </Tooltip>
            <Tooltip content="Excluir" color="danger">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={() => remove(n.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <CmsPageLayout routeActive="notifications-global">
      <CmsPageHeader
        title="Notificações"
        description="Gerencie e publique notificações para os tenants da plataforma."
        icon={<Bell className="w-6 h-6" />}
        actionLabel="Nova notificação"
        actionIcon={<Plus className="w-4 h-4" />}
        onActionClick={() => router.push("/dashboard/global/notifications/new")}
      />

      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="w-full h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Table
            aria-label="Notificações"
            classNames={{
              wrapper: "shadow-none border border-border rounded-xl",
              th: "bg-default-50 text-muted-foreground text-xs font-medium uppercase tracking-wide",
              td: "py-3",
            }}
          >
            <TableHeader columns={COLUMNS}>
              {(col) => <TableColumn key={col.key}>{col.label}</TableColumn>}
            </TableHeader>
            <TableBody
              items={data}
              emptyContent={
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Bell className="w-10 h-10 opacity-30" />
                  <p className="text-sm">Nenhuma notificação encontrada</p>
                </div>
              }
            >
              {(n: any) => (
                <TableRow key={n.id}>
                  {(colKey) => (
                    <TableCell>{renderCell(n, colKey as string)}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                total={totalPages}
                page={page}
                onChange={setPage}
                color="primary"
                variant="light"
              />
            </div>
          )}
        </div>
      )}
    </CmsPageLayout>
  );
}
