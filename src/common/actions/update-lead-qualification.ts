'use server'

import { cookies } from 'next/headers';
import { updateLeadQualificationService } from '../services/update-lead-qualification-service';

export async function updateLeadQualification(leadId: string, card: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    const session = cookieStore.get('session-code');

    return updateLeadQualificationService({
        token: token?.value || '',
        session: session?.value || '',
        lead_id: leadId,
        card: card
    })
}