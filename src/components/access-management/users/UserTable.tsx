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
import { User } from '@/src/common/@types/@access-management';
import { formatDate } from '@/src/lib/utils';

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onEdit: (user: User) => void;
  onDeactivate: (userId: number) => void;
  onDelete: (userId: number) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  onEdit,
  onDeactivate,
  onDelete,
}) => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created At' },
    { key: 'actions', label: 'Actions' },
  ];

  const renderCell = (user: User, columnKey: React.Key) => {
    switch (columnKey) {
      case 'id':
        return <span className="text-sm text-gray-700">{user.id}</span>;
      
      case 'name':
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{user.name}</span>
          </div>
        );
      
      case 'email':
        return <span className="text-sm text-gray-600">{user.email}</span>;
      
      case 'status':
        return (
          <Chip
            color={user.is_active ? 'success' : 'danger'}
            size="sm"
            variant="dot"
          >
            {user.is_active ? 'Active' : 'Inactive'}
          </Chip>
        );
      
      case 'created_at':
        return (
          <span className="text-sm text-gray-600">
            {formatDate(user.created_at)}
          </span>
        );
      
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <Tooltip content="Edit user">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onEdit(user)}
                aria-label="Edit user"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            {user.is_active && (
              <Tooltip content="Deactivate user">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="warning"
                  onPress={() => onDeactivate(user.id)}
                  aria-label="Deactivate user"
                >
                  <Power className="w-4 h-4" />
                </Button>
              </Tooltip>
            )}
            
            <Tooltip content="Delete user" color="danger">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={() => onDelete(user.id)}
                aria-label="Delete user"
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

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No users found</p>
        <p className="text-gray-400 text-sm mt-2">
          Users will appear here once they are created
        </p>
      </div>
    );
  }

  return (
    <Table
      aria-label="User management table"
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
      <TableBody items={users}>
        {(user) => (
          <TableRow key={user.id}>
            {(columnKey) => (
              <TableCell>{renderCell(user, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default UserTable;
