'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/src/common/hooks/notifications/use-notifications';
import { apiClient } from '@/src/common/config/api';

export function NotificationList() {
  const [page, setPage] = useState(1);
  const { data, total, loading, refetch } = useNotifications({ page, limit: 20 });

  const publish = async (id: string) => {
    await apiClient.post(`/api/notifications/${id}/publish`);
    refetch();
  };

  const remove = async (id: string) => {
    await apiClient.delete(`/api/notifications/${id}`);
    refetch();
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notificações</h1>
        <Link
          href="/dashboard/global/notifications/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Nova notificação
        </Link>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2">Título</th>
              <th className="pb-2">Tipo</th>
              <th className="pb-2">Escopo</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map((n: any) => (
              <tr key={n.id} className="border-b hover:bg-gray-50">
                <td className="py-3 pr-4 font-medium">{n.title}</td>
                <td className="py-3 pr-4 capitalize text-gray-500">{n.type}</td>
                <td className="py-3 pr-4 capitalize text-gray-500">{n.scope}</td>
                <td className="py-3 pr-4">
                  {n.published_at ? (
                    <span className="text-green-600">Publicado</span>
                  ) : (
                    <span className="text-yellow-600">Rascunho</span>
                  )}
                </td>
                <td className="flex gap-2 py-3">
                  {!n.published_at && (
                    <button onClick={() => publish(n.id)} className="text-xs text-blue-600 hover:underline">
                      Publicar
                    </button>
                  )}
                  {!n.published_at && (
                    <Link
                      href={`/dashboard/global/notifications/${n.id}`}
                      className="text-xs text-gray-600 hover:underline"
                    >
                      Editar
                    </Link>
                  )}
                  {!n.published_at && (
                    <button onClick={() => remove(n.id)} className="text-xs text-red-500 hover:underline">
                      Excluir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
