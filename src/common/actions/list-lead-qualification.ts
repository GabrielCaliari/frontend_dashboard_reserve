'use server'

import { cookies } from 'next/headers';
import { listLeadQualificationService } from '../services/list-lead-qualification-service';
import { ILeadQualificationMessage } from '@/src/interfaces/lead-qualification.interface';

export async function listLeadQualification() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    const session = cookieStore.get('session-code');

    const result = await listLeadQualificationService({
        token: token?.value || '',
        session: session?.value || ''
    })

    const keys = Object.keys(result);

    return keys.map((key: string) => {
        const messages = result[key] as ILeadQualificationMessage[];

        return {
            message_id: key,
            lead_name: messages[0].profile_name,
            phone_number: messages[0].phone_number,
            card: messages[0].kb_card,
            messages
        }
    });
}