'use client';
import { useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { apiClient } from '@/src/common/config/api';

interface Props {
  initial?: any;
  id?: string;
}

export function NotificationForm({ initial, id }: Props) {
  const { push } = useRouter();
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    body: initial?.body ?? '',
    type: initial?.type ?? 'manual',
    scope: initial?.scope ?? 'broadcast',
    tenant_ids: (initial?.tenant_ids ?? []).join(','),
    send_email: initial?.send_email ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        tenant_ids:
          form.scope === 'targeted'
            ? form.tenant_ids
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
      };
      if (id) {
        await apiClient.patch(`/api/notifications/${id}`, payload);
      } else {
        await apiClient.post('/api/notifications', payload);
      }
      push('/dashboard/global/notifications');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err.message ?? 'Erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">{id ? 'Editar notificação' : 'Nova notificação'}</h1>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <label className="flex flex-col gap-1 text-sm">
        Título
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
          maxLength={255}
          className="rounded border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Corpo
        <textarea
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          required
          rows={5}
          className="rounded border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Escopo
        <select
          value={form.scope}
          onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
          className="rounded border px-3 py-2"
        >
          <option value="broadcast">Broadcast (todos os tenants)</option>
          <option value="targeted">Segmentado</option>
        </select>
      </label>
      {form.scope === 'targeted' && (
        <label className="flex flex-col gap-1 text-sm">
          IDs dos tenants (separados por vírgula)
          <input
            value={form.tenant_ids}
            onChange={(e) => setForm((f) => ({ ...f, tenant_ids: e.target.value }))}
            className="rounded border px-3 py-2"
            placeholder="id1, id2, ..."
          />
        </label>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.send_email}
          onChange={(e) => setForm((f) => ({ ...f, send_email: e.target.checked }))}
        />
        Enviar por email
      </label>
      <button
        type="submit"
        disabled={loading}
        className="self-start rounded bg-blue-600 px-6 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? 'Salvando...' : 'Salvar rascunho'}
      </button>
    </form>
  );
}
