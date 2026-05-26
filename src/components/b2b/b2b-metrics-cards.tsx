'use client';

import { Card, CardBody, Spinner } from '@heroui/react';
import { DollarSign, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useB2BMetrics } from '@/src/common/hooks/useB2BPayments';

export function B2BMetricsCards() {
  const t = useTranslations('payments.b2b');
  const { data: metrics, isLoading } = useB2BMetrics();

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const cards = [
    {
      title: t('metricTotalRevenue'),
      value: formatPrice(metrics.totalRevenue),
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: t('metricTotalPurchases'),
      value: metrics.totalPurchases.toString(),
      subtitle: `${metrics.totalCompleted} ${t('metricCompleted')}`,
      icon: ShoppingCart,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: t('metricConversionRate'),
      value: formatPercentage(metrics.conversionRate),
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: t('metricAbandonmentRate'),
      value: formatPercentage(metrics.abandonmentRate),
      subtitle: `${metrics.totalAbandoned} ${t('metricAbandoned')}`,
      icon: TrendingDown,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: t('metricAverageOrderValue'),
      value: formatPrice(metrics.averageOrderValue),
      icon: DollarSign,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="border-none shadow-sm">
            <CardBody className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
                  <p className="text-2xl font-bold mb-1">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                  )}
                </div>
                <div className={`${card.bgColor} ${card.color} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
