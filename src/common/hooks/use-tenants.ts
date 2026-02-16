'use client'

import { useState, useEffect } from 'react';
import { Tenant } from '@/src/common/@types/@auth';
import { listMyTenants } from '../actions/tenant';
import toast from 'react-hot-toast';

export default function useTenants() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTenants = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await listMyTenants();

            if (typeof result === 'string') {
                setError(result);
                toast.error('Erro ao carregar empresas');
                return;
            }

            setTenants(result);
        } catch (err) {
            setError('Erro ao carregar empresas');
            toast.error('Erro ao carregar empresas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    return { tenants, loading, error, refetch: fetchTenants };
}
