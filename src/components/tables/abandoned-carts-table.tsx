"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Check,
  X,
  Clock,
  Send,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  ShoppingCart,
} from "lucide-react";
import { AbandonedCartModal } from "../email-builder/modals/abandoned-cart-modal";
import { useTranslations, useLocale } from "next-intl";
import { useAbandonedCarts, type AbandonedCart } from "@/src/common/hooks/payments/use-abandoned-carts";
import { Button, Chip, Skeleton } from "@heroui/react";

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

// Componente para status visual
const StatusIcon = ({ status }: { status: "sent" | "pending" | "failed" }) => {
  switch (status) {
    case "sent":
      return <Check className="w-4 h-4 text-green-400" />;
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-400" />;
    case "failed":
      return <X className="w-4 h-4 text-red-400" />;
  }
};

// Componente para sequência de emails
const EmailSequenceStatus = ({
  sequence,
}: {
  sequence: AbandonedCart["emailSequence"];
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Send className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">1</span>
        <StatusIcon status={sequence.step1} />
      </div>
      <div className="flex items-center gap-1">
        <Send className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">2</span>
        <StatusIcon status={sequence.step2} />
      </div>
      <div className="flex items-center gap-1">
        <Send className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">3</span>
        <StatusIcon status={sequence.step3} />
      </div>
    </div>
  );
};

// Componente para status de SMS
const SmsStatus = ({ status }: { status: "sent" | "pending" | "failed" }) => {
  return (
    <div className="flex items-center gap-2">
      <MessageSquare className="w-4 h-4 text-muted-foreground" />
      <StatusIcon status={status} />
    </div>
  );
};

export function AbandonedCartsTable() {
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations();
  const locale = useLocale();
  
  const { data: carts = [], isLoading, refetch } = useAbandonedCarts();

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));

  const handleOptionsClick = (cart: AbandonedCart) => {
    setSelectedCart(cart);
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'abandoned':
        return 'danger';
      case 'incomplete':
        return 'warning';
      case 'past_due':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: 'subscription' | 'one_time') => {
    return type === 'subscription' ? t("payments.movementsPage.typeSubscription") : t("payments.movementsPage.typeOneTime");
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header com botão de refresh */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              {carts.length === 0 
                ? t("abandonedCart.noAbandoned") 
                : carts.length === 1
                ? t("abandonedCart.oneAbandoned")
                : t("abandonedCart.countAbandoned", { count: carts.length })}
            </p>
          </div>
          <Button
            size="sm"
            variant="flat"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={() => refetch()}
          >
            {t("common.refresh")}
          </Button>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("abandonedCart.customer")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("abandonedCart.product")}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("abandonedCart.type")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("abandonedCart.amount")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("abandonedCart.status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("abandonedCart.date")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("abandonedCart.emailStatus")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("abandonedCart.smsStatus")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("abandonedCart.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-800">
              {carts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 opacity-40" />
                      <p className="text-sm font-medium">
                        {t("abandonedCart.noAbandoned")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                carts.map((cart) => (
                  <tr
                    key={cart.id}
                    className="hover:bg-muted transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {cart.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{cart.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {cart.products[0]?.name || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Chip 
                        size="sm" 
                        variant="flat"
                        color={cart.type === 'subscription' ? 'secondary' : 'primary'}
                      >
                        {getTypeLabel(cart.type)}
                      </Chip>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground">
                      {formatPrice(cart.amount, cart.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Chip 
                        size="sm" 
                        variant="flat"
                        color={getStatusColor(cart.status)}
                      >
                        {t(`payments.movementsPage.status${cart.status.charAt(0).toUpperCase() + cart.status.slice(1)}`)}
                      </Chip>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(cart.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {cart.emailSequence && (
                        <EmailSequenceStatus sequence={cart.emailSequence} />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {cart.smsStatus && <SmsStatus status={cart.smsStatus} />}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        {cart.stripeLink && (
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => window.open(cart.stripeLink!, "_blank")}
                            aria-label="View on Stripe"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <button
                          onClick={() => handleOptionsClick(cart)}
                          className="p-2 rounded-full hover:bg-muted transition-colors"
                        >
                          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AbandonedCartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cart={selectedCart}
      />
    </>
  );
}
