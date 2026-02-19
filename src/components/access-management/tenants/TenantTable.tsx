'use client';

import React from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Skeleton,
  Tooltip,
} from '@nextui-org/react';
import { Edit, Power, Trash2 } from 'lucide-react';
import { Tenant } from '@/src/common/@types/@access-management';
import { formatDate } from '@/src/lib/utils';

interface TenantTableProps {
  tenants: Tenant[];
  isLoading: boolean;
  onEdit: (tenant: Tenant) => void;
  onToggleActive: (tenantId: number, isActive: boolean) => void;
  onDelete: (tenantId: number) => void;
}

const TenantTable: React.FC<TenantTableProps> = ({
  tenants,
  isLoading,
  onEdit,
  onToggleActive,
  onDelete,
}) => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    { key: 'domain', label: 'Domain' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created At' },
    { key: 'actions', label: 'Actions' },
  ];

  const renderCell = (tenant: Tenant, columnKey: React.Key) => {
    switch (columnKey) {
      case 'id':
        return <span className="text-sm text-gray-700">{tenant.id}</span>;
      
      case 'name':
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{tenant.name}</span>
          </div>
        );
      
      case 'slug':
        return <span className="text-sm text-gray-600">{tenant.slug}</span>;
      
      case 'domain':
        return <span className="text-sm text-gray-600">{tenant.domain}</span>;
      
      case 'status':
        return (
          <Chip
            color={tenant.is_active ? 'success' : 'danger'}
            size="sm"
            variant="dot"
          >
            {tenant.is_active ? 'Active' : 'Inactive'}
          </Chip>
        );
      
      case 'created_at':
        return (
          <span className="text-sm text-gray-600">
            {formatDate(tenant.created_at)}
          </span>
        );
      
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <Tooltip content="Edit tenant">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onEdit(tenant)}
                aria-label="Edit tenant"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Tooltip content={tenant.is_active ? 'Deactivate tenant' : 'Activate tenant'}>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color={tenant.is_active ? 'warning' : 'success'}
                onPress={() => onToggleActive(tenant.id, tenant.is_active)}
                aria-label={tenant.is_active ? 'Deactivate tenant' : 'Activate tenant'}
              >
                <Power className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Tooltip content="Delete tenant" color="danger">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={() => onDelete(tenant.id)}
                aria-label="Delete tenant"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex gap-4 items-center">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No tenants found</p>
        <p className="text-gray-400 text-sm mt-2">
          Create a new tenant to get started
        </p>
      </div>
    );
  }

  return (
    <Table
      aria-label="Tenant management table"
      classNames={{
        wrapper: 'shadow-none border border-gray-200',
        th: 'bg-gray-50 text-gray-700 font-semibold',
        td: 'py-4',
      }}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.key}
            align={column.key === 'actions' ? 'center' : 'start'}
          >
            {column.label}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={tenants}>
        {(tenant) => (
          <TableRow key={tenant.id}>
            {(columnKey) => (
              <TableCell>{renderCell(tenant, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default TenantTable;
