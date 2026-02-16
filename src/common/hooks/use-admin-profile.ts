'use client'

import { useState, useEffect } from 'react';
import { AdminProfile } from '@/src/common/@types/@auth';
import { getAdminProfile } from '../actions/admin-profile';
import toast from 'react-hot-toast';

export default function useAdminProfile() {
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await getAdminProfile();

            if (typeof result === 'string') {
                setError(result);
                toast.error('Erro ao carregar perfil');
                return;
            }

            setProfile(result);
        } catch (err) {
            setError('Erro ao carregar perfil');
            toast.error('Erro ao carregar perfil');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    return { profile, loading, error, refetch: fetchProfile };
}
