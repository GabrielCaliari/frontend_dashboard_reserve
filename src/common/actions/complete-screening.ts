'use server'

import { completeScreeningService } from '../services/complete-screening-service';

export async function completeScreening(leadId: string) {
    return completeScreeningService({
        lead_id: leadId
    });
}