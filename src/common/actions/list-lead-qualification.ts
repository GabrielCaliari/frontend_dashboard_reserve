'use server'

import { listLeadQualificationService } from '../services/list-lead-qualification-service';
import { ILeadQualificationMessage } from '@/src/common/interfaces/lead-qualification.interface';

export async function listLeadQualification() {
    const result = await listLeadQualificationService();

    const keys = Object.keys(result);

    return keys.map((key: string) => {
        const messages = result[key] as ILeadQualificationMessage[];

        return {
            message_id: key,
            lead_name: messages[0].profile_name,
            phone_number: messages[0].phone_number,
            card: messages[0].kb_card,
            screening_complete: messages[0].screening_complete,
            temperature: messages[0].temperature,
            analyzed: messages[0].analyzed,
            messages
        }
    });
}