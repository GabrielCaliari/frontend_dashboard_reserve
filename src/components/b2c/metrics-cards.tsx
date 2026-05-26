'use client';

import { Card, CardBody, Skeleton } from '@heroui/react';
import { Users, TrendingUp, DollarSign, UserX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useB2CMetrics } from '@/src/common/hooks/useB2CSubscriptions';

export function B2CMetricsCards() {
  const { data: metrics, isLoading } = useB2CMetrics();
  const t = useTranslations('payments.b2c');

  const cards = [
    {
      title: t('metricsActiveSubscriptions'),
      value: metrics?.totalActive || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: t('metricsMRR'),
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format((metrics?.mrr || 0) / 100),
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: t('metricsNewSubscribers'),
      value: metrics?.newSubscribers || 0,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: t('metricsChurnRate'),
      value: `${((metrics?.churnRate || 0) * 100).toFixed(1)}%`,
      icon: UserX,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 rounded" />
                ) : (
                  <p className="text-2xl font-bold">{card.value}</p>
                )}
              </div>
              <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
