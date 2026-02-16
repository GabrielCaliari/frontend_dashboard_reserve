import { deleteCookie } from 'cookies-next';

export function clearAuthCookies() {
    deleteCookie('token');
    deleteCookie('session-code');
    deleteCookie('session-name');
    deleteCookie('session-email');
    deleteCookie('session-role');
}

export function logout() {
    clearAuthCookies();
    if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
    }
}
