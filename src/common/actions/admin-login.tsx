'use server'

import { adminLoginService } from '../services/admin-login';
import { IAuthenticateAdmin } from '@/src/interfaces/admin.interface';

export async function adminLogin({ email, password }: IAuthenticateAdmin) {
    return adminLoginService({
        email,
        password
    })
}