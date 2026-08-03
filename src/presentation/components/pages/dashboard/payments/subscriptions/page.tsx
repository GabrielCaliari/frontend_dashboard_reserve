"use client";

import { useState, useMemo } from"react";
import { useRouter, useSearchParams } from"next/navigation";
import { useTranslations, useLocale } from"next-intl";
import {
 Table,
 TableHeader,
 TableColumn,
 TableBody,
 TableRow,
 TableCell,
 Chip,
 Button,
 Select,
 SelectItem,
 Skeleton,
 Modal,
 ModalContent,
 ModalHeader,
 ModalBody,
 ModalFooter,
 Tooltip,
} from"@heroui/react";
import {
 RefreshCw,
 CreditCard,
 ChevronLeft,
 ChevronRight,
 FileX,
 X,
 ExternalLink,
 Eye,
 ShoppingCart,
} from"lucide-react";
import { LayoutScopeRoot } from"@/src/presentation/components/layouts/root-layout";
import { usePaymentMovements } from"@/src/shared/hooks/payments/use-payment-movements";
import type {
 PaymentMovement,
 MovementType,
 MovementStatus,
} from"@/src/shared/domain/types/@payment-movements";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number, currency: string) {
 return new Intl.NumberFormat("pt-BR", {
 style:"currency",
 currency: currency.toUpperCase(),
 }).format(amount / 100);
}

const TYPE_COLORS: Record<MovementType,"secondary" |"primary"> = {
 subscription:"secondary",
 one_time:"primary",
};

const STATUS_COLORS: Record<
 MovementStatus,"success" |"warning" |"danger" |"default" |"secondary"
> = {
 completed:"success",
 active:"success",
 trialing:"secondary",
 pending:"warning",
 past_due:"warning",
 incomplete:"warning",
 abandoned:"danger",
 canceled:"default",
 refunded:"default",
};

// ─── Product cell ─────────────────────────────────────────────────────────────

function ProductCell({
 movement,
 onExpand,
 tooltipLabel,
}: {
 movement: PaymentMovement;
 onExpand: (m: PaymentMovement) => void;
 tooltipLabel: string;
}) {
 const extra = (movement.products?.length ?? 0) - 1;

 return (
 <div className="flex items-center gap-2">
 <span className="text-sm text-foreground truncate max-w-[160px]">
 {movement.productName ||"—"}
 </span>
 {extra > 0 && (
 <Tooltip content={tooltipLabel}>
 <button
 type="button"
 onClick={() => onExpand(movement)}
 className="flex-shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
 >
 +{extra}
 </button>
 </Tooltip>
 )}
 </div>
 );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
 return (
 <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0">
 <span className="text-xs text-muted-foreground shrink-0">{label}</span>
 <span className="text-sm text-foreground text-right">{children}</span>
 </div>
 );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
 return (
 <div>
 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
 {title}
 </p>
 <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] px-4 py-1">
 {children}
 </div>
 </div>
 );
}

function MovementDetailModal({
 movement,
 isOpen,
 onClose,
 typeLabels,
 statusLabels,
}: {
 movement: PaymentMovement | null;
 isOpen: boolean;
 onClose: () => void;
 typeLabels: Record<MovementType, string>;
 statusLabels: Record<MovementStatus, string>;
}) {
 const t = useTranslations("payments.movementsPage");
 const locale = useLocale();

 if (!movement) return null;

 const fmt = (d?: string) =>
 d
 ? new Intl.DateTimeFormat(locale, {
 day:"2-digit",
 month:"2-digit",
 year:"numeric",
 hour:"2-digit",
 minute:"2-digit",
 }).format(new Date(d))
 :"—";

 const products =
 movement.products && movement.products.length > 0
 ? movement.products
 : [{ id: movement.productId ??"", name: movement.productName }];

 const stripeLink =
 movement.stripeLink ??
 (movement.stripeSubscriptionId
 ?`https://dashboard.stripe.com/subscriptions/${movement.stripeSubscriptionId}`
 : null);

 const hasStripeRefs =
 movement.stripeCheckoutId ||
 movement.stripeSubscriptionId ||
 movement.stripePaymentIntentId;

 return (
 <Modal
 isOpen={isOpen}
 onClose={onClose}
 size="2xl"
 classNames={{
 base:"bg-background border border-white/10",
 header:"border-b border-white/[0.07] py-4",
 footer:"border-t border-white/[0.07] py-3",
 body:"py-5",
 }}
 >
 <ModalContent>
 <ModalHeader className="flex items-center gap-2.5">
 <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
 <ShoppingCart className="w-3.5 h-3.5 text-primary" />
 </div>
 <span className="text-base font-semibold text-foreground">{t("detailTitle")}</span>
 <div className="ml-auto flex items-center gap-2">
 <Chip color={STATUS_COLORS[movement.status]} variant="flat" size="sm">
 {statusLabels[movement.status] ?? movement.status}
 </Chip>
 <Chip color={TYPE_COLORS[movement.type]} variant="flat" size="sm">
 {typeLabels[movement.type]}
 </Chip>
 </div>
 </ModalHeader>

 <ModalBody className="space-y-4">
 {/* Amount hero */}
 <div className="rounded-xl bg-primary/5 border border-primary/10 px-5 py-4 flex items-center justify-between">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
 {t("detailLabelTotal")}
 </p>
 <p className="text-2xl font-bold text-foreground">
 {formatPrice(movement.amount, movement.currency)}
 </p>
 </div>
 <div className="text-right">
 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
 {t("detailLabelCreatedAt")}
 </p>
 <p className="text-sm text-foreground">{fmt(movement.createdAt)}</p>
 {movement.completedAt && (
 <>
 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2 mb-0.5">
 {t("detailLabelCompletedAt")}
 </p>
 <p className="text-sm text-foreground">{fmt(movement.completedAt)}</p>
 </>
 )}
 </div>
 </div>

 {/* Two columns */}
 <div className="grid grid-cols-2 gap-4">
 {/* LEFT */}
 <div className="space-y-4">
 <Section title={t("detailSectionCustomer")}>
 <Row label={t("detailLabelName")}>{movement.customerName ||"—"}</Row>
 <Row label={t("detailLabelEmail")}>
 <span className="truncate max-w-[160px] block">{movement.customerEmail ||"—"}</span>
 </Row>
 {movement.customerPhone && (
 <Row label={t("detailLabelPhone")}>{movement.customerPhone}</Row>
 )}
 </Section>

 <Section title={t("detailProductsCount", { count: products.length })}>
 {products.map((prod, i) => (
 <div
 key={prod.id || i}
 className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0"
 >
 <span className="text-sm text-foreground truncate">{prod.name}</span>
 {prod.id && (
 <code className="text-[11px] text-muted-foreground font-mono shrink-0">
 {prod.id.slice(0, 8)}…
 </code>
 )}
 </div>
 ))}
 </Section>
 </div>

 {/* RIGHT */}
 <div className="space-y-4">
 <Section title={t("detailSectionPayment")}>
 <Row label={t("detailLabelCurrency")}>
 <span className="uppercase font-medium">{movement.currency}</span>
 </Row>
 <Row label={t("detailLabelType")}>
 <Chip color={TYPE_COLORS[movement.type]} variant="flat" size="sm">
 {typeLabels[movement.type]}
 </Chip>
 </Row>
 <Row label={t("detailLabelStatus")}>
 <Chip color={STATUS_COLORS[movement.status]} variant="flat" size="sm">
 {statusLabels[movement.status] ?? movement.status}
 </Chip>
 </Row>
 {movement.currentPeriodStart && (
 <Row label={t("detailLabelPeriod")}>
 <span className="text-xs">
 {fmt(movement.currentPeriodStart)} → {fmt(movement.currentPeriodEnd)}
 </span>
 </Row>
 )}
 </Section>

 {hasStripeRefs && (
 <Section title={t("detailSectionStripe")}>
 {movement.stripeCheckoutId && (
 <Row label={t("detailLabelCheckoutId")}>
 <code className="text-[11px] font-mono text-muted-foreground truncate max-w-[150px] block">
 {movement.stripeCheckoutId}
 </code>
 </Row>
 )}
 {movement.stripePaymentIntentId && (
 <Row label={t("detailLabelPaymentIntent")}>
 <code className="text-[11px] font-mono text-muted-foreground truncate max-w-[150px] block">
 {movement.stripePaymentIntentId}
 </code>
 </Row>
 )}
 {movement.stripeSubscriptionId && (
 <Row label={t("detailLabelSubscriptionId")}>
 <code className="text-[11px] font-mono text-muted-foreground truncate max-w-[150px] block">
 {movement.stripeSubscriptionId}
 </code>
 </Row>
 )}
 </Section>
 )}
 </div>
 </div>
 </ModalBody>

 <ModalFooter className="gap-2 justify-end">
 <Button size="sm" variant="flat" color="default" onPress={onClose}>
 {t("detailClose")}
 </Button>
 {stripeLink && (
 <Button
 size="sm"
 color="primary"
 startContent={<ExternalLink className="w-3.5 h-3.5" />}
 onPress={() => window.open(stripeLink,"_blank")}
 >
 {t("detailViewStripe")}
 </Button>
 )}
 </ModalFooter>
 </ModalContent>
 </Modal>
 );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 30;

export default function PaymentsSubscriptionsPage() {
 const t = useTranslations("payments.movementsPage");
 const locale = useLocale();
 const router = useRouter();
 const searchParams = useSearchParams();

 const [selectedMovement, setSelectedMovement] = useState<PaymentMovement | null>(null);
 const [isDetailOpen, setIsDetailOpen] = useState(false);

 const openDetail = (movement: PaymentMovement) => {
 setSelectedMovement(movement);
 setIsDetailOpen(true);
 };
 const closeDetail = () => {
 setIsDetailOpen(false);
 setSelectedMovement(null);
 };

 const formatDate = (dateString: string) =>
 new Intl.DateTimeFormat(locale, {
 day:"2-digit",
 month:"2-digit",
 year:"numeric",
 hour:"2-digit",
 minute:"2-digit",
 }).format(new Date(dateString));

 const page = Number(searchParams.get("page") ||"1");
 const typeFilter = (searchParams.get("type") ||"all") as MovementType |"all";
 const statusFilter = (searchParams.get("status") ||"all") as MovementStatus |"all";

 const { data, isLoading, refetch } = usePaymentMovements({
 type: typeFilter,
 status: statusFilter,
 limit: 500,
 });

 const allMovements = data?.data ?? [];
 const totalCount = allMovements.length;
 const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
 const paginatedMovements = allMovements.slice(
 (page - 1) * PAGE_SIZE,
 page * PAGE_SIZE
 );

 const hasAnyFilter = typeFilter !=="all" || statusFilter !=="all";

 const updateParam = (key: string, value: string) => {
 const params = new URLSearchParams(searchParams.toString());
 if (value && value !=="all") params.set(key, value);
 else params.delete(key);
 params.set("page","1");
 router.push(`/dashboard/payments/subscriptions?${params.toString()}`);
 };

 const clearFilters = () => router.push("/dashboard/payments/subscriptions");

 const handlePageChange = (newPage: number) => {
 if (newPage < 1 || newPage > totalPages) return;
 const params = new URLSearchParams(searchParams.toString());
 params.set("page", String(newPage));
 router.push(`/dashboard/payments/subscriptions?${params.toString()}`);
 };

 const pageNumbers = useMemo(() => {
 if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
 const pages: (number |"...")[] = [];
 if (page <= 4) {
 pages.push(1, 2, 3, 4, 5,"...", totalPages);
 } else if (page >= totalPages - 3) {
 pages.push(1,"...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
 } else {
 pages.push(1,"...", page - 1, page, page + 1,"...", totalPages);
 }
 return pages;
 }, [page, totalPages]);

 const firstItem = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
 const lastItem = Math.min(page * PAGE_SIZE, totalCount);

 const subtitle = isLoading
 ? t("subtitleLoading")
 : totalCount === 1
 ? t("subtitleCount", { count: totalCount })
 : t("subtitleCountPlural", { count: totalCount });

 const COLUMNS = [
 { key:"customer", label: t("columnCustomer") },
 { key:"product", label: t("columnProduct") },
 { key:"type", label: t("columnType") },
 { key:"amount", label: t("columnAmount") },
 { key:"status", label: t("columnStatus") },
 { key:"date", label: t("columnDate") },
 { key:"actions", label:"" },
 ];

 const TYPE_LABELS: Record<MovementType, string> = {
 subscription: t("typeSubscription"),
 one_time: t("typeOneTime"),
 };

 const STATUS_LABELS: Record<MovementStatus, string> = {
 completed: t("statusCompleted"),
 active: t("statusActive"),
 pending: t("statusPending"),
 abandoned: t("statusAbandoned"),
 canceled: t("statusCanceled"),
 refunded: t("statusRefunded"),
 trialing: t("statusTrialing"),
 past_due: t("statusPastDue"),
 incomplete: t("statusIncomplete"),
 };

 const renderCell = (movement: PaymentMovement, key: string) => {
 switch (key) {
 case"customer":
 return (
 <div>
 <p className="font-medium text-foreground">
 {movement.customerName || movement.customerEmail}
 </p>
 {movement.customerName && (
 <p className="text-xs text-muted-foreground">{movement.customerEmail}</p>
 )}
 </div>
 );

 case"product":
 return (
 <ProductCell
 movement={movement}
 onExpand={openDetail}
 tooltipLabel={t("detailViewAllProducts", {
 count: movement.products?.length ?? 1,
 })}
 />
 );

 case"type":
 return (
 <Chip color={TYPE_COLORS[movement.type]} variant="flat" size="sm">
 {TYPE_LABELS[movement.type]}
 </Chip>
 );

 case"amount":
 return (
 <span className="font-semibold text-foreground">
 {formatPrice(movement.amount, movement.currency)}
 </span>
 );

 case"status":
 return (
 <div className="flex flex-col gap-1">
 <Chip color={STATUS_COLORS[movement.status]} variant="flat" size="sm">
 {STATUS_LABELS[movement.status] ?? movement.status}
 </Chip>
 {movement.cancelAtPeriodEnd && (
 <Chip size="sm" variant="flat" color="warning">
 {t("cancelAtPeriodEnd")}
 </Chip>
 )}
 </div>
 );

 case"date":
 return (
 <span className="text-sm text-muted-foreground">{formatDate(movement.createdAt)}</span>
 );

 case"actions": {
 const link =
 movement.stripeLink ??
 (movement.stripeSubscriptionId
 ?`https://dashboard.stripe.com/subscriptions/${movement.stripeSubscriptionId}`
 : null);

 return (
 <div className="flex items-center gap-1">
 <Tooltip content={t("detailTooltip")}>
 <Button
 size="sm"
 variant="light"
 isIconOnly
 onPress={() => openDetail(movement)}
 aria-label={t("detailTooltip")}
 >
 <Eye className="w-3.5 h-3.5" />
 </Button>
 </Tooltip>
 {link && (
 <Tooltip content={t("viewOnStripe")}>
 <Button
 size="sm"
 variant="light"
 isIconOnly
 onPress={() => window.open(link,"_blank")}
 aria-label={t("viewOnStripe")}
 >
 <ExternalLink className="w-3.5 h-3.5" />
 </Button>
 </Tooltip>
 )}
 </div>
 );
 }

 default:
 return null;
 }
 };

 return (
 <LayoutScopeRoot>
 <div className="p-6 space-y-5">
 {/* Header */}
 <div className="flex items-center justify-between flex-wrap gap-3">
 <div>
 <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
 <CreditCard className="w-6 h-6" />
 {t("title")}
 </h1>
 <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
 </div>
 <Button
 variant="flat"
 startContent={<RefreshCw className="w-4 h-4" />}
 onPress={() => refetch()}
 isLoading={isLoading}
 size="sm"
 >
 {t("refresh")}
 </Button>
 </div>

 {/* Filters */}
 <div className="flex flex-wrap gap-3 items-center">
 <Select
 size="sm"
 variant="bordered"
 selectedKeys={[typeFilter]}
 onChange={(e) => updateParam("type", e.target.value)}
 aria-label={t("allTypes")}
 className="w-44"
 classNames={{ trigger:"border-border bg-default-100/50" }}
 >
 <SelectItem key="all">{t("allTypes")}</SelectItem>
 <SelectItem key="subscription">{t("typeSubscription")}</SelectItem>
 <SelectItem key="one_time">{t("typeOneTime")}</SelectItem>
 </Select>

 <Select
 size="sm"
 variant="bordered"
 selectedKeys={[statusFilter]}
 onChange={(e) => updateParam("status", e.target.value)}
 aria-label={t("allStatuses")}
 className="w-48"
 classNames={{ trigger:"border-border bg-default-100/50" }}
 >
 <SelectItem key="all">{t("allStatuses")}</SelectItem>
 <SelectItem key="active">{t("statusActive")}</SelectItem>
 <SelectItem key="completed">{t("statusCompleted")}</SelectItem>
 <SelectItem key="pending">{t("statusPending")}</SelectItem>
 <SelectItem key="trialing">{t("statusTrialing")}</SelectItem>
 <SelectItem key="abandoned">{t("statusAbandoned")}</SelectItem>
 <SelectItem key="canceled">{t("statusCanceled")}</SelectItem>
 <SelectItem key="refunded">{t("statusRefunded")}</SelectItem>
 <SelectItem key="past_due">{t("statusPastDue")}</SelectItem>
 </Select>

 {hasAnyFilter && (
 <Button
 size="sm"
 variant="light"
 color="danger"
 startContent={<X className="w-3.5 h-3.5" />}
 onPress={clearFilters}
 >
 {t("clearFilters")}
 </Button>
 )}
 </div>

 {/* Table */}
 <div className="overflow-x-auto w-full">
 <Table
 aria-label={t("title")}
 classNames={{
 wrapper:"rounded-xl border border-border",
 th:"bg-default-100 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
 tr:"hover:bg-default-100/50 transition-colors",
 }}
 >
 <TableHeader columns={COLUMNS}>
 {(col) => (
 <TableColumn key={col.key}>{col.label.toUpperCase()}</TableColumn>
 )}
 </TableHeader>
 <TableBody
 items={paginatedMovements}
 isLoading={isLoading}
 loadingContent={
 <div className="p-4 space-y-3">
 {[...Array(6)].map((_, i) => (
 <Skeleton key={i} className="h-10 w-full rounded-lg" />
 ))}
 </div>
 }
 emptyContent={
 <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
 <FileX className="w-10 h-10 opacity-40" />
 <p className="text-sm font-medium">
 {hasAnyFilter ? t("noMovementsFiltered") : t("noMovements")}
 </p>
 {hasAnyFilter && (
 <Button
 size="sm"
 variant="flat"
 onPress={clearFilters}
 startContent={<X className="w-3.5 h-3.5" />}
 >
 {t("clearFilters")}
 </Button>
 )}
 </div>
 }
 >
 {(movement) => (
 <TableRow key={movement.id}>
 {(col) => (
 <TableCell>{renderCell(movement, col as string)}</TableCell>
 )}
 </TableRow>
 )}
 </TableBody>
 </Table>
 </div>

 {/* Pagination */}
 {!isLoading && totalCount > 0 && (
 <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
 <p className="text-sm text-muted-foreground">
 {t("showing", { first: firstItem, last: lastItem, total: totalCount })}
 </p>

 {totalPages > 1 && (
 <div className="flex items-center gap-1">
 <Button
 isIconOnly size="sm" variant="flat"
 isDisabled={page <= 1}
 onPress={() => handlePageChange(page - 1)}
 aria-label={t("previous")}
 >
 <ChevronLeft className="w-4 h-4" />
 </Button>

 {pageNumbers.map((p, i) =>
 p ==="..." ? (
 <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground select-none">…</span>
 ) : (
 <Button
 key={p}
 isIconOnly size="sm"
 variant={p === page ?"solid" :"flat"}
 color={p === page ?"primary" :"default"}
 onPress={() => handlePageChange(p as number)}
 >
 {p}
 </Button>
 )
 )}

 <Button
 isIconOnly size="sm" variant="flat"
 isDisabled={page >= totalPages}
 onPress={() => handlePageChange(page + 1)}
 aria-label={t("next")}
 >
 <ChevronRight className="w-4 h-4" />
 </Button>
 </div>
 )}
 </div>
 )}
 </div>

 <MovementDetailModal
 movement={selectedMovement}
 isOpen={isDetailOpen}
 onClose={closeDetail}
 typeLabels={TYPE_LABELS as Record<MovementType, string>}
 statusLabels={STATUS_LABELS as Record<MovementStatus, string>}
 />
 </LayoutScopeRoot>
 );
}
