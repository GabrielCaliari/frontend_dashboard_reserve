'use server'

import { cookies } from 'next/headers';
import { completeScreeningService } from '../services/complete-screening-service';

export async function completeScreening(leadId: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    const session = cookieStore.get('session-code');

    return completeScreeningService({
        lead_id: leadId,
        token: token?.value || '',
        session: session?.value || '',
    })
}