"use client";

import { useState } from"react";
import { useTranslations } from"next-intl";
import { ShieldAlert } from"lucide-react";
import type { ConfigSchemaField } from"@/src/common/@types/@stats";

interface DynamicConfigFormProps {
 configSchema: Record<string, ConfigSchemaField>;
 initialValues?: Record<string, unknown>;
 onChange: (config: Record<string, unknown>) => void;
 isEdit?: boolean;
}

export function DynamicConfigForm({
 configSchema,
 initialValues = {},
 onChange,
 isEdit = false,
}: DynamicConfigFormProps) {
 const t = useTranslations("stats.integrations");
 const [values, setValues] = useState<Record<string, string>>(() => {
 const initial: Record<string, string> = {};
 for (const [key, field] of Object.entries(configSchema)) {
 const val = initialValues[key];
 if (field.secret && isEdit) {
 initial[key] ="";
 } else if (val !== undefined && val !== null) {
 initial[key] =
 field.type ==="json" ? JSON.stringify(val, null, 2) : String(val);
 } else {
 initial[key] ="";
 }
 }
 return initial;
 });

 const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});

 const handleChange = (key: string, value: string, field: ConfigSchemaField) => {
 const next = { ...values, [key]: value };
 setValues(next);

 // Validate JSON fields
 const nextErrors = { ...jsonErrors };
 if (field.type ==="json" && value.trim()) {
 try {
 JSON.parse(value);
 delete nextErrors[key];
 } catch {
 nextErrors[key] = t("invalidJson");
 }
 } else {
 delete nextErrors[key];
 }
 setJsonErrors(nextErrors);

 // Build config object, skip empty secret fields in edit mode
 const config: Record<string, unknown> = {};
 for (const [k, f] of Object.entries(configSchema)) {
 const v = next[k];
 if (f.secret && isEdit && !v) continue;
 if (f.type ==="json" && v.trim()) {
 try {
 config[k] = JSON.parse(v);
 } catch {
 config[k] = v;
 }
 } else if (v) {
 config[k] = v;
 }
 }
 onChange(config);
 };

 return (
 <div className="space-y-4">
 {Object.entries(configSchema).map(([key, field]) => (
 <div key={key}>
 <label className="block text-sm font-medium text-foreground mb-1">
 {key}
 {field.required && <span className="text-red-400 ml-0.5">*</span>}
 </label>
 <p className="text-xs text-muted-foreground mb-1.5">{field.description}</p>

 {field.secret && (
 <div className="flex items-center gap-1.5 mb-1.5">
 <ShieldAlert className="h-3 w-3 text-amber-400" />
 <span className="text-xs text-amber-400">
 {isEdit ? t("secretEditHint") : t("secretHint")}
 </span>
 </div>
 )}

 {field.type ==="json" ? (
 <textarea
 value={values[key]}
 onChange={(e) => handleChange(key, e.target.value, field)}
 placeholder={
 field.secret && isEdit
 ? t("secretPlaceholder")
 :'{"key":"value" }'
 }
 rows={4}
 className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
 />
 ) : (
 <input
 type={field.secret ?"password" :"text"}
 value={values[key]}
 onChange={(e) => handleChange(key, e.target.value, field)}
 placeholder={
 field.secret && isEdit ? t("secretPlaceholder") :""
 }
 className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
 />
 )}

 {jsonErrors[key] && (
 <p className="text-xs text-red-400 mt-1">{jsonErrors[key]}</p>
 )}
 </div>
 ))}
 </div>
 );
}
