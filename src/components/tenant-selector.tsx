'use client'

import { useState } from 'react';
import { Select, SelectItem } from '@nextui-org/react';
import useTenants from '@/src/common/hooks/use-tenants';

export default function TenantSelector() {
    const { tenants, loading } = useTenants();
    const [selectedTenant, setSelectedTenant] = useState<string>('');

    if (loading) {
        return <div>Carregando empresas...</div>;
    }

    if (tenants.length === 0) {
        return null;
    }

    return (
        <Select
            label="Empresa"
            placeholder="Selecione uma empresa"
            selectedKeys={selectedTenant ? [selectedTenant] : []}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="max-w-xs"
        >
            {tenants.map((tenant) => (
                <SelectItem key={tenant.id.toString()} value={tenant.id.toString()}>
                    {tenant.name}
                </SelectItem>
            ))}
        </Select>
    );
}
