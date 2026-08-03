"use client";

import { loginSchema } from"@/src/shared/schemas/login-schema";
import { Input } from"@heroui/react";
import { useFormik } from"formik";
import { useRouter } from"nextjs-toploader/app";
import { useState } from"react";
import useAdminAuthentication from"@/src/shared/hooks/use-user-authentication";
import { useTranslations } from"next-intl";
import { PasswordInput } from"@/src/presentation/components/atoms/reserve/password-input";
import { Button } from"@/src/presentation/components/atoms/shadcn-ui/button";

export function LoginForm() {
 const { execAdminAuthentication } = useAdminAuthentication();
 const t = useTranslations();

 const [loading, setLoading] = useState(false);

 const { replace } = useRouter();

 const formik = useFormik({
 initialValues: {
 email:"",
 password:"",
 },
 validationSchema: loginSchema(t as any),
 onSubmit: async (values) => {
 setLoading(true);
 try {
 const result = await execAdminAuthentication({
 email: values.email,
 password: values.password,
 });

 if (result) {
 replace("/dashboard");
 }
 } finally {
 setLoading(false);
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
 label={t("auth.emailLabel")}
 placeholder={t("auth.emailPlaceholder")}
 type="text"
 size="lg"
 className="rounded-xl"
 errorMessage={formik.touched.email && formik.errors.email}
 isInvalid={formik.touched.email && Boolean(formik.errors.email)}
 {...formik.getFieldProps("email")}
 />
 </div>
 <div className="flex flex-col w-full">
 <PasswordInput
 label={t("auth.password")}
 placeholder={t("auth.yourPassword")}
 size="lg"
 className="rounded-xl"
 errorMessage={formik.touched.password && formik.errors.password}
 isInvalid={
 formik.touched.password && Boolean(formik.errors.password)
 }
 {...formik.getFieldProps("password")}
 />
 {formik.touched.password && formik.errors.password && (
 <div className="text-red-500 text-sm mt-2">{}</div>
 )}
 </div>

 <div className="flex w-full mt-2">
 <Button
 size="lg"
 type="submit"
 className="w-full"
 isLoading={loading}
 disabled={loading}
 >
 {t("auth.login")}
 </Button>
 </div>
 </form>
 </>
 );
}
