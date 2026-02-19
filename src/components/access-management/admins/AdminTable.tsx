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
import { Admin, AdminRole } from '@/src/common/@types/@access-management';
import { formatDate } from '@/src/lib/utils';

interface AdminTableProps {
  admins: Admin[];
  isLoading: boolean;
  onEdit: (admin: Admin) => void;
  onToggleActive: (adminId: number, isActive: boolean) => void;
  onDelete: (adminId: number) => void;
}

const AdminTable: React.FC<AdminTableProps> = ({
  admins,
  isLoading,
  onEdit,
  onToggleActive,
  onDelete,
}) => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created At' },
    { key: 'actions', label: 'Actions' },
  ];

  const getRoleColor = (role: AdminRole): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
    switch (role) {
      case AdminRole.super_admin:
        return 'danger';
      case AdminRole.owner:
        return 'primary';
      case AdminRole.manager:
        return 'secondary';
      case AdminRole.editor:
        return 'success';
      case AdminRole.viewer:
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const formatRoleLabel = (role: AdminRole): string => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const renderCell = (admin: Admin, columnKey: React.Key) => {
    switch (columnKey) {
      case 'id':
        return <span className="text-sm text-gray-700">{admin.id}</span>;
      
      case 'name':
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{admin.name}</span>
          </div>
        );
      
      case 'email':
        return <span className="text-sm text-gray-600">{admin.email}</span>;
      
      case 'role':
        return (
          <Chip
            color={getRoleColor(admin.role)}
            size="sm"
            variant="flat"
          >
            {formatRoleLabel(admin.role)}
          </Chip>
        );
      
      case 'status':
        return (
          <Chip
            color={admin.is_active ? 'success' : 'danger'}
            size="sm"
            variant="dot"
          >
            {admin.is_active ? 'Active' : 'Inactive'}
          </Chip>
        );
      
      case 'created_at':
        return (
          <span className="text-sm text-gray-600">
            {formatDate(admin.created_at)}
          </span>
        );
      
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <Tooltip content="Edit admin">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onEdit(admin)}
                aria-label="Edit admin"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Tooltip content={admin.is_active ? 'Deactivate admin' : 'Activate admin'}>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color={admin.is_active ? 'warning' : 'success'}
                onPress={() => onToggleActive(admin.id, admin.is_active)}
                aria-label={admin.is_active ? 'Deactivate admin' : 'Activate admin'}
              >
                <Power className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Tooltip content="Delete admin" color="danger">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={() => onDelete(admin.id)}
                aria-label="Delete admin"
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

  if (admins.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No admins found</p>
        <p className="text-gray-400 text-sm mt-2">
          Create a new admin to get started
        </p>
      </div>
    );
  }

  return (
    <Table
      aria-label="Admin management table"
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
      <TableBody items={admins}>
        {(admin) => (
          <TableRow key={admin.id}>
            {(columnKey) => (
              <TableCell>{renderCell(admin, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default AdminTable;
