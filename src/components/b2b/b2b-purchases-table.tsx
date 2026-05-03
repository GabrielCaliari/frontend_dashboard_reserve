'use client';

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
  Select,
  SelectItem,
} from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { B2BPurchase, PurchaseStatus } from '@/src/common/@types/@b2b-payments';
import { useListB2BPurchases } from '@/src/common/hooks/useB2BPayments';

const statusColorMap: Record<PurchaseStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  completed: 'success',
  pending: 'warning',
  abandoned: 'danger',
  refunded: 'default',
};

export function B2BPurchasesTable() {
  const t = useTranslations('payments.b2b');
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | 'all'>('all');

  const { data, isLoading } = useListB2BPurchases({
    status: statusFilter,
    limit: 50,
  });

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  const purchases = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{t('purchasesTitle')}</h3>
        <Select
          label={t('filterByStatus')}
          selectedKeys={[statusFilter]}
          onChange={(e) => setStatusFilter(e.target.value as PurchaseStatus | 'all')}
          className="w-48"
          size="sm"
        >
          <SelectItem key="all" value="all">
            {t('statusAll')}
          </SelectItem>
          <SelectItem key="completed" value="completed">
            {t('statusCompleted')}
          </SelectItem>
          <SelectItem key="pending" value="pending">
            {t('statusPending')}
          </SelectItem>
          <SelectItem key="abandoned" value="abandoned">
            {t('statusAbandoned')}
          </SelectItem>
          <SelectItem key="refunded" value="refunded">
            {t('statusRefunded')}
          </SelectItem>
        </Select>
      </div>

      {purchases.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          {t('noPurchases')}
        </div>
      ) : (
        <Table aria-label={t('purchasesTitle')}>
          <TableHeader>
            <TableColumn>{t('columnProduct').toUpperCase()}</TableColumn>
            <TableColumn>{t('columnCustomer').toUpperCase()}</TableColumn>
            <TableColumn>{t('columnAmount').toUpperCase()}</TableColumn>
            <TableColumn>{t('columnStatus').toUpperCase()}</TableColumn>
            <TableColumn>{t('columnDate').toUpperCase()}</TableColumn>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell>
                  <div className="font-medium">{purchase.productName}</div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{purchase.customerEmail}</div>
                    {purchase.customerName && (
                      <div className="text-sm text-gray-500">{purchase.customerName}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-semibold">
                    {formatPrice(purchase.amount, purchase.currency)}
                  </span>
                </TableCell>
                <TableCell>
                  <Chip
                    color={statusColorMap[purchase.status]}
                    variant="flat"
                    size="sm"
                  >
                    {t(`status${purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}` as any)}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDate(purchase.completedAt || purchase.createdAt)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
