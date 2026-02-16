"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { Reader, TReaderDocument } from "@usewaypoint/email-builder";
import { z } from "zod";
import type { TimeZone } from "@vvo/tzdb";
import { useTranslations } from "next-intl";

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  templateName: string;
  emailStatus: "sent" | "pending" | "failed";
  initialData?: {
    subject?: string;
    preheader?: string;
    sender?: string;
    provider?: string;
    sendAfterHours?: number;
    content?: any[];
  };
}

const createEmailSchema = (t: (key: string) => string) =>
  z.object({
    subject: z.string().min(1, t("validation.subjectRequired")),
    preheader: z.string().min(1, t("validation.preHeaderRequired")),
    sender: z.string().email(t("validation.senderInvalidEmail")),
    provider: z.string().min(1, t("validation.providerRequired")),
    sendAfterHours: z.number().min(0, t("validation.sendTimeMin")),
    content: z.string().min(1, t("validation.contentRequired")),
    timeZone: z.string().min(1, t("validation.timezoneRequired")),
    time: z.string().min(1, t("validation.timeRequired")),
  });

let _timeZonesCache: TimeZone[] | null = null;
function getTimeZonesLazy(): TimeZone[] {
  if (!_timeZonesCache) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getTimeZones } = require("@vvo/tzdb") as typeof import("@vvo/tzdb");
    _timeZonesCache = getTimeZones();
  }
  return _timeZonesCache;
}

export function EmailTemplateModal({
  isOpen,
  onClose,
  templateId,
  templateName,
  emailStatus,
  initialData,
}: EmailTemplateModalProps) {
  const t = useTranslations();
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [preheader, setPreheader] = useState(initialData?.preheader || "");
  const [sender, setSender] = useState(initialData?.sender || "");
  const [provider, setProvider] = useState(initialData?.provider || "");
  const [sendAfterHours, setSendAfterHours] = useState(
    initialData?.sendAfterHours || 24,
  );
  const [content, setContent] = useState<string>(
    Array.isArray(initialData?.content)
      ? initialData.content.join("")
      : initialData?.content || "",
  );
  const [errors, setErrors] = useState<{
    subject?: string;
    preheader?: string;
    sender?: string;
    provider?: string;
    sendAfterHours?: string;
    content?: string;
    timeZone?: string;
    time?: string;
  }>({});
  const [timeZone, setTimeZone] = useState("America/Sao_Paulo");
  const [time, setTime] = useState("");

  const defaultDocument: TReaderDocument = {
    root: {
      type: "EmailLayout",
      data: {
        backdropColor: "#F8F8F8",
        canvasColor: "#FFFFFF",
        textColor: "#242424",
        fontFamily: "MODERN_SANS",
        childrenIds: [],
      },
    },
  };

  if (!isOpen) return null;

  const validateForm = () => {
    const formData = {
      subject,
      preheader,
      sender,
      provider,
      sendAfterHours,
      content,
      timeZone,
      time,
    };

    const result = createEmailSchema(t).safeParse(formData);
    if (!result.success) {
      const newErrors = Object.fromEntries(
        Object.entries(result.error.format()).map(([key, value]) => [
          key,
          value && "_errors" in value ? value._errors[0] : undefined,
        ]),
      );
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const emailData = {
      templateId,
      subject,
      preheader,
      sender,
      provider,
      sendAfterHours,
      content,
      timeZone,
      time,
    };

    console.log("Email configurado:", emailData);
    // Aqui você implementará a lógica para salvar o template e configurações
    onClose();
  };

  // Ajuste no padrão de disparo dos emails
  const emailDispatchOptions = [
    { label: t("emailTemplate.immediate"), value: 0 },
    { label: t("emailTemplate.24hours"), value: 24 },
    { label: t("emailTemplate.48hours"), value: 48 },
  ];

  const inputClasses =
    "w-full px-3 py-2 bg-[#12121f] border border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-200 placeholder-gray-500";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#16162a] rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">
              {emailStatus === "sent"
                ? t("emailTemplate.viewEmail")
                : t("emailTemplate.configureEmail")}
              : {templateName}
            </h3>
            {emailStatus !== "sent" && (
              <p className="text-sm text-gray-400 mt-1">
                {t("emailTemplate.configureContent")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Configurações do Email */}
        <div className="p-6 space-y-6">
          {emailStatus !== "sent" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {t("emailTemplate.subject")}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("emailTemplate.subjectPlaceholder")}
                  className={inputClasses}
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-400">{errors.subject}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {t("emailTemplate.preHeader")}
                </label>
                <input
                  type="text"
                  value={preheader}
                  onChange={(e) => setPreheader(e.target.value)}
                  placeholder={t("emailTemplate.preHeaderPlaceholder")}
                  className={inputClasses}
                />
                {errors.preheader && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.preheader}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {t("emailTemplate.sender")}
                </label>
                <input
                  type="text"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder={t("emailTemplate.senderPlaceholder")}
                  className={inputClasses}
                />
                {errors.sender && (
                  <p className="mt-1 text-sm text-red-400">{errors.sender}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {t("emailTemplate.emailProvider")}
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className={inputClasses}
                >
                  <option value="">{t("emailTemplate.selectProvider")}</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailchimp">Mailchimp</option>
                  <option value="aws-ses">AWS SES</option>
                  {/* Adicione mais provedores conforme necessário */}
                </select>
                {errors.provider && (
                  <p className="mt-1 text-sm text-red-400">{errors.provider}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {t("emailTemplate.sendAfter")}
                </label>
                <select
                  value={sendAfterHours}
                  onChange={(e) => setSendAfterHours(Number(e.target.value))}
                  className={inputClasses}
                >
                  {emailDispatchOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.sendAfterHours && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.sendAfterHours}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {t("emailTemplate.timezone")}
                </label>
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className={inputClasses}
                >
                  {getTimeZonesLazy().map((tz: { name: string }) => (
                    <option key={tz.name} value={tz.name}>
                      {tz.name}
                    </option>
                  ))}
                </select>
                {errors.timeZone && (
                  <p className="mt-1 text-sm text-red-400">{errors.timeZone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {t("emailTemplate.time")}
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={inputClasses}
                />
                {errors.time && (
                  <p className="mt-1 text-sm text-red-400">{errors.time}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              {t("emailTemplate.emailContent")}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("emailTemplate.htmlPlaceholder")}
              className="w-full h-64 px-3 py-2 bg-[#12121f] border border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-200 placeholder-gray-500"
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-400">{errors.content}</p>
            )}
          </div>

          <div className="mt-4 p-4 border border-gray-700 rounded-md bg-white">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700 bg-[#12121f]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            {emailStatus === "sent" ? t("common.close") : t("common.cancel")}
          </button>
          {emailStatus !== "sent" && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {t("emailTemplate.saveAndSchedule")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
