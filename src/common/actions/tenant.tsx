'use server'

import { listMyTenantsService } from '../services/tenant';

export async function listMyTenants() {
    return listMyTenantsService();
}
