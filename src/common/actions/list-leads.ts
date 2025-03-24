'use server';

import { cookies } from "next/headers";
import { listLeadsService } from "../services/list-leads-service";

export const listLeads = async (page: number = 1) => {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    const session = cookieStore.get('session-code');

    const result = await listLeadsService({
        token: token?.value || '',
        session: session?.value || '',
        page
    });

    return result;
}
