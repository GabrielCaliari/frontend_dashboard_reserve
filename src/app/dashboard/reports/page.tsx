"use client";

import { useState, useMemo } from"react";
import {
 Button,
 Spinner,
 useDisclosure,
 Table,
 TableHeader,
 TableColumn,
 TableBody,
 TableRow,
 TableCell,
 Tooltip,
 Select,
 SelectItem,
 Card,
 CardBody,
} from"@heroui/react";
import {
 Plus,
 Pencil,
 Trash2,
 FileBarChart2,
 ExternalLink,
} from"lucide-react";
import { useTranslations } from"next-intl";
import { useRouter } from"nextjs-toploader/app";
import { LayoutScopeRoot } from"@/src/layout/root-layout";
import usePermissions from"@/src/common/hooks/use-permissions";
import {
 useReports,
 useCreateReport,
 useUpdateReport,
 useDeleteReport,
} from"@/src/common/hooks/reports/use-reports";
import type { Report } from"@/src/common/@types/@report";
import { ReportDialog } from"@/src/components/reports/report-dialog";
import { DeleteReportDialog } from"@/src/components/reports/delete-report-dialog";

const LIMIT_OPTIONS = [10, 20, 50];

function truncateUrl(url: string, maxLength: number = 40): string {
 if (url.length <= maxLength) return url;
 return`${url.slice(0, maxLength)}...`;
}

export default function ReportsPage() {
 const t = useTranslations("reports");
 const router = useRouter();
 const { isSuperAdmin } = usePermissions();

 const [page, setPage] = useState(1);
 const [limit, setLimit] = useState(20);

 const { data, isLoading, isError } = useReports({ page, limit });
 const createMutation = useCreateReport();
 const updateMutation = useUpdateReport();
 const deleteMutation = useDeleteReport();

 // Dialog state
 const {
 isOpen: isFormOpen,
 onOpen: openForm,
 onClose: closeForm,
 } = useDisclosure();
 const {
 isOpen: isDeleteOpen,
 onOpen: openDelete,
 onClose: closeDelete,
 } = useDisclosure();

 const [editingReport, setEditingReport] = useState<Report | null>(null);
 const [deletingReport, setDeletingReport] = useState<Report | null>(null);

 // Guard: redirect non-super-admins
 if (!isSuperAdmin) {
 router.push("/dashboard");
 return null;
 }

 const reports = data?.data ?? [];
 const meta = data?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 };
 const start = (meta.page - 1) * meta.limit + 1;
 const end = Math.min(meta.page * meta.limit, meta.total);

 const handleCreate = () => {
 setEditingReport(null);
 openForm();
 };

 const handleEdit = (report: Report) => {
 setEditingReport(report);
 openForm();
 };

 const handleDelete = (report: Report) => {
 setDeletingReport(report);
 openDelete();
 };

 const handleFormSubmit = (values: {
 phone: string;
 url: string;
 label?: string;
 }) => {
 if (editingReport) {
 updateMutation.mutate(
 { id: editingReport.id, data: values },
 { onSuccess: () => closeForm() },
 );
 } else {
 createMutation.mutate(values, { onSuccess: () => closeForm() });
 }
 };

 const handleDeleteConfirm = (id: string) => {
 deleteMutation.mutate(id);
 };

 const columns = [
 { key:"phone", label: t("columnPhone") },
 { key:"label", label: t("columnLabel") },
 { key:"url", label: t("columnUrl") },
 { key:"createdAt", label: t("columnCreatedAt") },
 { key:"actions", label: t("columnActions") },
 ];

 return (
 <LayoutScopeRoot routeActive="reports">
 <div className="mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl">
 {/* Header */}
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-primary/10 rounded-lg">
 <FileBarChart2 className="w-6 h-6 text-primary" />
 </div>
 <div>
 <h1 className="text-2xl font-bold text-foreground">
 {t("title")}
 </h1>
 <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
 </div>
 </div>
 <Button
 color="primary"
 startContent={<Plus className="h-4 w-4" />}
 onPress={handleCreate}
 >
 {t("newReport")}
 </Button>
 </div>

 {/* Table */}
 {isLoading ? (
 <div className="flex justify-center py-16">
 <Spinner size="lg" />
 </div>
 ) : isError ? (
 <Card className="border-red-500/20 bg-red-500/5">
 <CardBody className="p-6 text-center">
 <p className="text-sm text-red-400">
 Error loading reports. Please try again.
 </p>
 </CardBody>
 </Card>
 ) : reports.length === 0 ? (
 <Card className="border-border bg-card">
 <CardBody className="flex flex-col items-center justify-center py-16 text-center">
 <FileBarChart2 className="h-10 w-10 text-muted-foreground mb-3" />
 <p className="text-muted-foreground mb-1">{t("noReportsFound")}</p>
 <p className="text-sm text-muted-foreground mb-4">
 {t("noReportsDescription")}
 </p>
 <Button
 color="primary"
 variant="flat"
 size="sm"
 startContent={<Plus className="h-4 w-4" />}
 onPress={handleCreate}
 >
 {t("newReport")}
 </Button>
 </CardBody>
 </Card>
 ) : (
 <>
 <Table
 aria-label={t("title")}
 classNames={{
 wrapper:"bg-background border border-border",
 th:"bg-card text-muted-foreground text-xs uppercase",
 td:"text-foreground text-sm",
 }}
 >
 <TableHeader columns={columns}>
 {(column) => (
 <TableColumn key={column.key} className={column.key ==="actions" ?"text-right" :""}>
 {column.label}
 </TableColumn>
 )}
 </TableHeader>
 <TableBody items={reports}>
 {(report) => (
 <TableRow key={report.id}>
 <TableCell>{report.phone}</TableCell>
 <TableCell>
 <span className="text-muted-foreground">
 {report.label ||"—"}
 </span>
 </TableCell>
 <TableCell>
 <Tooltip content={report.url}>
 <a
 href={report.url}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 text-primary hover:underline max-w-xs"
 >
 <span className="truncate">
 {truncateUrl(report.url)}
 </span>
 <ExternalLink className="h-3 w-3 flex-shrink-0" />
 </a>
 </Tooltip>
 </TableCell>
 <TableCell>
 {new Date(report.createdAt).toLocaleDateString()}
 </TableCell>
 <TableCell>
 <div className="flex items-center justify-end gap-1">
 <Tooltip content={t("edit")}>
 <Button
 isIconOnly
 size="sm"
 variant="light"
 onPress={() => handleEdit(report)}
 >
 <Pencil className="h-4 w-4 text-muted-foreground" />
 </Button>
 </Tooltip>
 <Tooltip content={t("delete")} color="danger">
 <Button
 isIconOnly
 size="sm"
 variant="light"
 onPress={() => handleDelete(report)}
 >
 <Trash2 className="h-4 w-4 text-red-400" />
 </Button>
 </Tooltip>
 </div>
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>

 {/* Pagination */}
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
 <p className="text-xs text-muted-foreground">
 {t("showingResults", {
 start: String(start),
 end: String(end),
 total: String(meta.total),
 })}
 </p>
 <div className="flex items-center gap-3">
 <Select
 size="sm"
 aria-label={t("rowsPerPage")}
 selectedKeys={new Set([String(limit)])}
 onSelectionChange={(keys) => {
 const value = Array.from(keys)[0] as string;
 setLimit(Number(value));
 setPage(1);
 }}
 className="w-24"
 classNames={{ trigger:"bg-card border-border" }}
 >
 {LIMIT_OPTIONS.map((opt) => (
 <SelectItem key={String(opt)}>
 {String(opt)}
 </SelectItem>
 ))}
 </Select>
 <div className="flex items-center gap-1">
 <Button
 size="sm"
 variant="flat"
 isDisabled={page <= 1}
 onPress={() => setPage((p) => Math.max(1, p - 1))}
 >
 {t("previous")}
 </Button>
 <Button
 size="sm"
 variant="flat"
 isDisabled={page >= meta.totalPages}
 onPress={() => setPage((p) => p + 1)}
 >
 {t("next")}
 </Button>
 </div>
 </div>
 </div>
 </>
 )}

 {/* Create / Edit Dialog */}
 <ReportDialog
 isOpen={isFormOpen}
 onClose={closeForm}
 report={editingReport}
 onSubmit={handleFormSubmit}
 isSubmitting={createMutation.isPending || updateMutation.isPending}
 />

 {/* Delete Confirmation Dialog */}
 <DeleteReportDialog
 isOpen={isDeleteOpen}
 onClose={closeDelete}
 report={deletingReport}
 onConfirm={handleDeleteConfirm}
 isDeleting={deleteMutation.isPending}
 />
 </div>
 </LayoutScopeRoot>
 );
}
