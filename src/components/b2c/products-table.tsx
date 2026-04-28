'use client';

import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Spinner,
} from '@nextui-org/react';
import { ExternalLink, DollarSign } from 'lucide-react';
import type { Product } from '@/common/@types/@b2c-products';

interface ProductsTableProps {
  products: Product[];
  isLoading?: boolean;
}

export function ProductsTable({ products, isLoading }: ProductsTableProps) {
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatInterval = (interval: string, count: number) => {
    const intervals: Record<string, string> = {
      day: 'dia',
      week: 'semana',
      month: 'mês',
      year: 'ano',
    };
    const intervalText = intervals[interval] || interval;
    return count > 1 ? `${count} ${intervalText}s` : intervalText;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        Nenhum produto encontrado
      </div>
    );
  }

  return (
    <Table aria-label="Tabela de produtos B2C">
      <TableHeader>
        <TableColumn>NOME</TableColumn>
        <TableColumn>SLUG</TableColumn>
        <TableColumn>STATUS</TableColumn>
        <TableColumn>PREÇOS</TableColumn>
        <TableColumn>AÇÕES</TableColumn>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              <div>
                <div className="font-semibold">{product.name}</div>
                <div className="text-sm text-gray-500 line-clamp-1">
                  {product.description}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {product.slug}
              </code>
            </TableCell>
            <TableCell>
              <Chip
                color={product.active ? 'success' : 'default'}
                variant="flat"
                size="sm"
              >
                {product.active ? 'Ativo' : 'Inativo'}
              </Chip>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                {product.prices.map((price) => (
                  <div
                    key={price.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <DollarSign className="w-3 h-3" />
                    <span className="font-medium">
                      {formatPrice(price.unitAmount, price.currency)}
                    </span>
                    <span className="text-gray-500">
                      / {formatInterval(price.interval, price.intervalCount)}
                    </span>
                    {!price.active && (
                      <Chip size="sm" variant="flat" color="warning">
                        Inativo
                      </Chip>
                    )}
                  </div>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="light"
                startContent={<ExternalLink className="w-4 h-4" />}
                onPress={() =>
                  window.open(
                    `https://dashboard.stripe.com/products/${product.stripeProductId}`,
                    '_blank'
                  )
                }
              >
                Ver no Stripe
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
