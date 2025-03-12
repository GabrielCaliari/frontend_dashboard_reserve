"use client";

import { loginSchema } from "@/src/common/schemas/login-schema";
import { Button, Input, Spinner } from "@nextui-org/react";
import { setCookie } from "cookies-next";
import { useFormik } from "formik";
import { useRouter } from 'nextjs-toploader/app';
import { useState } from "react";

import api from "@/src/common/config/api";

import toast from "react-hot-toast";
import Link from "next/link";
import useAdminAuthentication from "@/src/common/hooks/use-user-authentication";

export function LoginForm() {
  const { execAdminAuthentication } = useAdminAuthentication();
  
  const [loading, setLoading] = useState(false);

  const { replace } = useRouter();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      const result = await execAdminAuthentication({
        email: values.email,
        password: values.password
      });

      if (result) {
        replace('/dashboard')
      }
    },
  });

  return (
    <>

      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-col gap-4 w-full mt-5"
      >
        <div className="flex flex-col w-full">
          <Input
            label="Email"
            placeholder="email@provedor.com.br"
            type="text"
            size="lg"
            className="rounded-xl"
            errorMessage={
              formik.touched.email && formik.errors.email
            }
            isInvalid={
              formik.touched.email &&
              Boolean(formik.errors.email)
            }
            {...formik.getFieldProps("email")}
          />
        </div>
        <div className="flex flex-col w-full">
          <Input
            label="Senha"
            placeholder="Sua senha"
            type="password"
            size="lg"
            className="rounded-xl"
            errorMessage={
              formik.touched.password && formik.errors.password
            }
            isInvalid={
              formik.touched.password &&
              Boolean(formik.errors.password)
            }
            {...formik.getFieldProps("password")}
          />
          {formik.touched.password && formik.errors.password && (
            <div className="text-red-500 text-sm mt-2">
              {}
            </div>
          )}
        </div>
            
        <div className="flex w-full mt-2">
          <Button
            fullWidth
            color="primary"
            size="lg"
            type="submit"
            isDisabled={loading}
          >
            {!loading && 'Entrar'}
            {loading && <Spinner color="white"  size="md"/>}
          </Button>
        </div>
      </form>
    </>
  );
}
