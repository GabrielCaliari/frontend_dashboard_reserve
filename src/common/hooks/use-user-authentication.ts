'use client'

import toast from "react-hot-toast";
import { setCookie } from "cookies-next";
import { IAuthenticateAdmin } from "@/src/interfaces/admin.interface";
import { adminLogin } from "../actions/admin-login";
import { errorTypes } from "../config/error-types";

export default function useAdminAuthentication() {
    const execAdminAuthentication = async ({ email, password }: IAuthenticateAdmin) => {
        const promise = adminLogin({
            email,
            password
        });

        return promise
            .then(async result => {
                if (
                    result.session_token
                ) {
                    await setCookie("session-code", result.session_id, {
                        maxAge: 60 * 60 * 24,
                    });

                    await setCookie("token", result.session_token, {
                        maxAge: 60 * 60 * 24,
                    });

                    await setCookie("session-name", result.details.name, {
                        maxAge: 60 * 60 * 24,
                    });

                    return true;
                }

                switch (result) {
                    case errorTypes._401.admin_email_nf:
                        toast.error('Não foi possível autenticar.');
                        break;
                    case errorTypes._401.admin_password_in:
                        toast.error('Não foi possível autenticar.');
                        break;
                    default:
                        toast.error('Ops... Deu erro.');
                }

                return false;
            })
            .catch((result) => {
                toast.error('Ops... Deu erro.');
                return false;
            })
    }

    return { execAdminAuthentication };
}