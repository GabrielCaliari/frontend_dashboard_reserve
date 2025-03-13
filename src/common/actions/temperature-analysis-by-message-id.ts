'use server'

import { cookies } from 'next/headers';
import { temperatureAnalysisByMessageIdService } from "../services/temperature-analysis-by-message-id-service";

export async function temperatureAnalysisByMessageId(messageId: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    const session = cookieStore.get('session-code');

    return temperatureAnalysisByMessageIdService({
        message_id: messageId,
        session: session?.value || '',
        token: token?.value || ''
    })
}