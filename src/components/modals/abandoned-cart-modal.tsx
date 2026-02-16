"use client";

import { useState } from "react";
import {
  X,
  Code,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Calendar,
  Mail,
  MousePointer,
  ExternalLink,
} from "lucide-react";
import { EmailTemplateModal } from "./email-template-modal";
import { useTranslations } from "next-intl";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface AccessOrigin {
  agent?: string;
  ip?: string;
}

interface AbandonedCart {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  gateway: string;
  products: Product[];
  accessOrigin?: AccessOrigin;
  emailSequence: {
    step1: "sent" | "pending" | "failed";
    step2: "sent" | "pending" | "failed";
    step3: "sent" | "pending" | "failed";
  };
  smsStatus: "sent" | "pending" | "failed";
  paymentProviderData?: any;
}

interface AbandonedCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: AbandonedCart | null;
}

export function AbandonedCartModal({
  isOpen,
  onClose,
  cart,
}: AbandonedCartModalProps) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState("info");
  const [showProductsJson, setShowProductsJson] = useState(false);
  const [showOriginJson, setShowOriginJson] = useState(false);
  const [showEmailJson, setShowEmailJson] = useState<number | null>(null);
  const [showClickedLinks, setShowClickedLinks] = useState<number | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    id: string;
    name: string;
    status: "sent" | "pending" | "failed";
    data?: {
      subject?: string;
      sendAfterHours?: number;
      content?: any[];
    };
  } | null>(null);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");

  if (!isOpen || !cart) return null;

  // Dados mockados mais completos para demonstração
  const mockCartData: AbandonedCart = {
    ...cart,
    email: "joao.silva@email.com",
    phone: "+55 11 99999-9999",
    address: "Rua das Flores, 123 - São Paulo, SP",
    products: [
      { id: "PROD001", name: "Smartphone Samsung Galaxy", price: 1299.99 },
      { id: "PROD002", name: "Capinha Protetora", price: 49.9 },
      { id: "PROD003", name: "Película de Vidro", price: 29.9 },
    ],
    accessOrigin: {
      agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      ip: "192.168.1.100",
    },
    paymentProviderData: {
      session_id: "cs_test_123456789",
      customer: {
        id: "cus_123456",
        email: "joao.silva@email.com",
        name: "João Silva",
      },
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Smartphone Samsung Galaxy",
            },
            unit_amount: 129999,
          },
          quantity: 1,
        },
      ],
      metadata: {
        cart_id: cart.id,
        source: "website",
      },
    },
  };

  const totalPrice = mockCartData.products.reduce(
    (sum, product) => sum + product.price,
    0,
  );

  const tabs = [
    { id: "info", label: t("abandonedCart.leadInfo") },
    { id: "emails", label: t("abandonedCart.emails") },
    { id: "sms", label: t("abandonedCart.sms") },
    { id: "actions", label: t("abandonedCart.actionsTab") },
    { id: "history", label: t("abandonedCart.history") },
  ];

  const handleEditTemplate = (
    templateId: string,
    templateName: string,
    status: "sent" | "pending" | "failed",
    existingData?: {
      subject?: string;
      sendAfterHours?: number;
      content?: any[];
    },
  ) => {
    setSelectedTemplate({
      id: templateId,
      name: templateName,
      status,
      data: existingData,
    });
    setIsTemplateModalOpen(true);
  };

  const handleSendSms = () => {
    if (window.confirm(t("abandonedCart.confirmSms"))) {
      console.log("SMS enviado:", smsMessage);
      setIsSmsModalOpen(false);
    }
  };

  const renderInfoTab = () => (
    <div className="space-y-6">
      {/* Informações Pessoais */}
      <div>
        <h4 className="font-semibold text-gray-100 mb-3">
          {t("abandonedCart.personalInfo")}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              {t("common.name")}
            </label>
            <p className="text-gray-200">{mockCartData.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              {t("common.email")}
            </label>
            <p className="text-gray-200">{mockCartData.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              {t("common.phone")}
            </label>
            <p className="text-gray-200">{mockCartData.phone}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              {t("abandonedCart.address")}
            </label>
            <p className="text-gray-200">{mockCartData.address}</p>
          </div>
        </div>
      </div>

      {/* Produtos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-100">
            {t("abandonedCart.products")}
          </h4>
          <button
            onClick={() => setShowProductsJson(!showProductsJson)}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Code className="w-4 h-4" />
            {showProductsJson
              ? t("abandonedCart.hideJson")
              : t("abandonedCart.viewJson")}
          </button>
        </div>

        {showProductsJson ? (
          <div className="bg-[#0a0a0f] text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-gray-800">
            <pre>{JSON.stringify(mockCartData.products, null, 2)}</pre>
          </div>
        ) : (
          <div className="space-y-3">
            {mockCartData.products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-[#1a1a2e] rounded-lg border border-gray-800"
              >
                <div>
                  <p className="font-medium text-gray-200">{product.name}</p>
                  <p className="text-sm text-gray-500">ID: {product.id}</p>
                </div>
                <p className="font-semibold text-gray-200">
                  R$ {product.price.toFixed(2).replace(".", ",")}
                </p>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t border-gray-700">
              <span className="font-semibold text-gray-200">
                {t("abandonedCart.total")}
              </span>
              <span className="font-bold text-lg text-gray-100">
                R$ {totalPrice.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Origem de Acesso */}
      {mockCartData.accessOrigin && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-100">
              {t("abandonedCart.accessOrigin")}
            </h4>
            <button
              onClick={() => setShowOriginJson(!showOriginJson)}
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Code className="w-4 h-4" />
              {showOriginJson
                ? t("abandonedCart.hideJson")
                : t("abandonedCart.viewJson")}
            </button>
          </div>

          {showOriginJson ? (
            <div className="bg-[#0a0a0f] text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-gray-800">
              <pre>
                {JSON.stringify(mockCartData.paymentProviderData, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="space-y-2">
              {mockCartData.accessOrigin.ip && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    IP
                  </label>
                  <p className="text-gray-200 font-mono text-sm">
                    {mockCartData.accessOrigin.ip}
                  </p>
                </div>
              )}
              {mockCartData.accessOrigin.agent && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    User Agent
                  </label>
                  <p className="text-gray-200 font-mono text-sm break-all">
                    {mockCartData.accessOrigin.agent}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderEmailsTab = () => {
    const emailSequences = [
      {
        id: 1,
        title: t("abandonedCart.email1"),
        status: mockCartData.emailSequence.step1,
        sentAt:
          mockCartData.emailSequence.step1 === "sent"
            ? "2024-01-15 14:30"
            : null,
        subject: "Você esqueceu alguns itens no seu carrinho!",
        template: "abandoned_cart_reminder_1",
        opened: mockCartData.emailSequence.step1 === "sent" ? true : false,
        openedAt:
          mockCartData.emailSequence.step1 === "sent"
            ? "2024-01-15 15:45"
            : null,
        clicked: mockCartData.emailSequence.step1 === "sent" ? true : false,
        clickedAt:
          mockCartData.emailSequence.step1 === "sent"
            ? "2024-01-15 16:20"
            : null,
        clickedLinks:
          mockCartData.emailSequence.step1 === "sent"
            ? [
                {
                  url: "https://loja.com/carrinho",
                  text: "Finalizar Compra",
                  clickedAt: "2024-01-15 16:20",
                },
                {
                  url: "https://loja.com/produto/smartphone",
                  text: "Ver Produto",
                  clickedAt: "2024-01-15 16:22",
                },
              ]
            : [],
        providerResponse: {
          messageId: "msg_1234567890",
          provider: "SendGrid",
          status: "delivered",
          deliveredAt: "2024-01-15 14:31:23",
          events: [
            { event: "processed", timestamp: "2024-01-15 14:30:45" },
            { event: "delivered", timestamp: "2024-01-15 14:31:23" },
            { event: "open", timestamp: "2024-01-15 15:45:12" },
            { event: "click", timestamp: "2024-01-15 16:20:34" },
          ],
        },
      },
      {
        id: 2,
        title: t("abandonedCart.email2"),
        status: mockCartData.emailSequence.step2,
        sentAt:
          mockCartData.emailSequence.step2 === "sent"
            ? "2024-01-16 10:15"
            : null,
        subject: "Oferta especial: 10% de desconto nos seus produtos!",
        template: "abandoned_cart_discount_10",
        opened: mockCartData.emailSequence.step2 === "sent" ? true : false,
        openedAt:
          mockCartData.emailSequence.step2 === "sent"
            ? "2024-01-16 11:30"
            : null,
        clicked: mockCartData.emailSequence.step2 === "sent" ? false : false,
        clickedAt: null,
        clickedLinks: [],
        providerResponse: {
          messageId: "msg_2345678901",
          provider: "SendGrid",
          status:
            mockCartData.emailSequence.step2 === "sent"
              ? "delivered"
              : "pending",
          deliveredAt:
            mockCartData.emailSequence.step2 === "sent"
              ? "2024-01-16 10:16:45"
              : null,
        },
      },
      {
        id: 3,
        title: t("abandonedCart.email3"),
        status: mockCartData.emailSequence.step3,
        sentAt:
          mockCartData.emailSequence.step3 === "sent"
            ? "2024-01-17 16:45"
            : null,
        subject: "Ultima chance! Seus produtos estao quase esgotando",
        template: "abandoned_cart_final_warning",
        opened: mockCartData.emailSequence.step3 === "sent" ? false : false,
        openedAt: null,
        clicked: false,
        clickedAt: null,
        clickedLinks: [],
        providerResponse: {
          messageId:
            mockCartData.emailSequence.step3 === "sent"
              ? "msg_3456789012"
              : null,
          provider: "SendGrid",
          status:
            mockCartData.emailSequence.step3 === "failed"
              ? "bounced"
              : mockCartData.emailSequence.step3,
          error:
            mockCartData.emailSequence.step3 === "failed"
              ? "Invalid email address"
              : null,
        },
      },
    ];

    const getStatusIcon = (status: "sent" | "pending" | "failed") => {
      switch (status) {
        case "sent":
          return <CheckCircle className="w-5 h-5 text-green-400" />;
        case "pending":
          return <Clock className="w-5 h-5 text-yellow-400" />;
        case "failed":
          return <XCircle className="w-5 h-5 text-red-400" />;
      }
    };

    const getStatusText = (status: "sent" | "pending" | "failed") => {
      switch (status) {
        case "sent":
          return t("abandonedCart.sent");
        case "pending":
          return t("abandonedCart.pending");
        case "failed":
          return t("abandonedCart.failed");
      }
    };

    const getStatusColor = (status: "sent" | "pending" | "failed") => {
      switch (status) {
        case "sent":
          return "bg-green-900/30 text-green-300 border border-green-700/50";
        case "pending":
          return "bg-yellow-900/30 text-yellow-300 border border-yellow-700/50";
        case "failed":
          return "bg-red-900/30 text-red-300 border border-red-700/50";
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-100">
            {t("abandonedCart.emailSequence")}
          </h4>
          <div className="text-sm text-gray-400">
            {t("abandonedCart.totalEmails")} {emailSequences.length}
          </div>
        </div>

        {emailSequences.map((email) => (
          <div
            key={email.id}
            className="border border-gray-700 rounded-lg p-6 bg-[#1a1a2e]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(email.status)}
                <div>
                  <h5 className="font-medium text-gray-100">{email.title}</h5>
                  <p className="text-sm text-gray-400">{email.subject}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(email.status)}`}
              >
                {getStatusText(email.status)}
              </span>
            </div>

            {email.status === "sent" && (
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#12121f] rounded-lg border border-gray-800">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      {t("abandonedCart.sentAt")}
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-200">
                        {email.sentAt}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      {t("abandonedCart.openStatus")}
                    </label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      {email.opened ? (
                        <div>
                          <span className="text-sm font-semibold text-green-400">
                            {t("abandonedCart.opened")}
                          </span>
                          <p className="text-xs text-gray-500">
                            {email.openedAt}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {t("abandonedCart.notOpened")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      {t("abandonedCart.clickStatus")}
                    </label>
                    <div className="flex items-center gap-2">
                      <MousePointer className="w-4 h-4 text-gray-500" />
                      {email.clicked ? (
                        <div>
                          <span className="text-sm font-semibold text-blue-400">
                            {t("abandonedCart.clicked")}
                          </span>
                          <p className="text-xs text-gray-500">
                            {email.clickedAt}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {t("abandonedCart.notClicked")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Links Clicados */}
                {email.clicked && email.clickedLinks.length > 0 && (
                  <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
                    <div className="flex items-center justify-between mb-3">
                      <h6 className="font-medium text-blue-300">
                        {t("abandonedCart.clickedLinks")}
                      </h6>
                      <button
                        onClick={() =>
                          setShowClickedLinks(
                            showClickedLinks === email.id ? null : email.id,
                          )
                        }
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        {showClickedLinks === email.id
                          ? t("abandonedCart.hide")
                          : t("abandonedCart.viewDetails")}
                      </button>
                    </div>

                    {showClickedLinks === email.id && (
                      <div className="space-y-2">
                        {email.clickedLinks.map((link, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-[#12121f] rounded border border-gray-700"
                          >
                            <div className="flex items-center gap-2">
                              <ExternalLink className="w-4 h-4 text-blue-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-200">
                                  {link.text}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {link.url}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {link.clickedAt}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {email.status === "failed" && (
              <div className="p-4 bg-red-900/20 rounded-lg mb-4 border border-red-700/30">
                <p className="text-sm text-red-300">
                  <strong>{t("abandonedCart.errorLabel")}</strong>{" "}
                  {email.providerResponse.error ||
                    t("abandonedCart.sendFailure")}
                </p>
              </div>
            )}

            {/* JSON do Provedor */}
            {showEmailJson === email.id && (
              <div className="mb-4">
                <h6 className="font-medium text-gray-200 mb-2">
                  {t("abandonedCart.providerResponse")}
                </h6>
                <div className="bg-[#0a0a0f] text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-gray-800">
                  <pre>{JSON.stringify(email.providerResponse, null, 2)}</pre>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() =>
                  handleEditTemplate(
                    email.template,
                    email.title,
                    email.status,
                    email.status === "sent"
                      ? {
                          subject: email.subject,
                          sendAfterHours: 24,
                          content: [],
                        }
                      : undefined,
                  )
                }
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                {email.status === "sent"
                  ? t("abandonedCart.viewTemplate")
                  : t("emailTemplate.configureEmail")}
              </button>

              {email.status === "sent" && (
                <button
                  onClick={() => console.log(`Reenviar email ${email.id}`)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t("abandonedCart.resend")}
                </button>
              )}

              {(email.status === "pending" || email.status === "failed") && (
                <button
                  onClick={() => console.log(`Enviar agora email ${email.id}`)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {email.status === "pending"
                    ? t("abandonedCart.sendNow")
                    : t("abandonedCart.tryAgain")}
                </button>
              )}

              <button
                onClick={() =>
                  setShowEmailJson(showEmailJson === email.id ? null : email.id)
                }
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-300 hover:bg-[#12121f] rounded-lg transition-colors"
              >
                <Code className="w-4 h-4" />
                {showEmailJson === email.id
                  ? t("abandonedCart.hideJson")
                  : t("abandonedCart.viewProviderJson")}
              </button>
            </div>
          </div>
        ))}

        <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
          <h6 className="font-medium text-blue-300 mb-2">
            {t("abandonedCart.sequenceConfig")}
          </h6>
          <div className="text-sm text-blue-300/80 space-y-1">
            <p>&#x2022; {t("abandonedCart.email1Desc")}</p>
            <p>&#x2022; {t("abandonedCart.email2Desc")}</p>
            <p>&#x2022; {t("abandonedCart.email3Desc")}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderSmsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-100">
          {t("abandonedCart.smsSequence")}
        </h4>
        <div className="text-sm text-gray-400">
          {t("abandonedCart.totalSms")}{" "}
          {mockCartData.smsStatus === "sent" ? 1 : 0}
        </div>
      </div>

      <div className="border border-gray-700 rounded-lg p-6 bg-[#1a1a2e]">
        <div className="rounded-lg border border-gray-800 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-[#12121f]">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  {t("abandonedCart.message")}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  {t("abandonedCart.sentAt")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#16162a] divide-y divide-gray-800">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {mockCartData.smsStatus === "sent"
                    ? t("abandonedCart.sent")
                    : t("abandonedCart.pending")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {t("abandonedCart.cartReminder")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {mockCartData.smsStatus === "sent"
                    ? "2024-01-15 14:30"
                    : "---"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <button
            onClick={() => setIsSmsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
            {t("abandonedCart.triggerSms")}
          </button>
        </div>
      </div>

      {isSmsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16162a] rounded-lg shadow-xl w-full max-w-md border border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-gray-100">
                {t("abandonedCart.sendSingleSms")}
              </h3>
              <button
                onClick={() => setIsSmsModalOpen(false)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder={t("abandonedCart.typeMessagePlaceholder")}
                className="w-full h-32 px-3 py-2 bg-[#12121f] border border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-200 placeholder-gray-500"
              />
              <button
                onClick={handleSendSms}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {t("abandonedCart.sendSms")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "info":
        return renderInfoTab();
      case "emails":
        return renderEmailsTab();
      case "sms":
        return renderSmsTab();
      case "actions":
        return (
          <div className="p-8 text-center text-gray-500">
            {t("abandonedCart.actionsInDev")}
          </div>
        );
      case "history":
        return (
          <div className="p-8 text-center text-gray-500">
            {t("abandonedCart.historyInDev")}
          </div>
        );
      default:
        return renderInfoTab();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#16162a] rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-gray-100">
              Carrinho #{cart.id} - {cart.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {renderTabContent()}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-700 bg-[#12121f]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      </div>

      {selectedTemplate && (
        <EmailTemplateModal
          isOpen={isTemplateModalOpen}
          onClose={() => {
            setIsTemplateModalOpen(false);
            setSelectedTemplate(null);
          }}
          templateId={selectedTemplate.id}
          templateName={selectedTemplate.name}
          emailStatus={selectedTemplate.status}
          initialData={selectedTemplate.data}
        />
      )}
    </>
  );
}
