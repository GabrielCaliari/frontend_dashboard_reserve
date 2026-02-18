"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Check,
  X,
  Clock,
  Send,
  MessageSquare,
} from "lucide-react";
import { AbandonedCartModal } from "../email-builder/modals/abandoned-cart-modal";
import { useTranslations } from "next-intl";

// Tipos para os dados
interface AbandonedCart {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  gateway: string;
  products: { id: string; name: string; price: number }[];
  emailSequence: {
    step1: "sent" | "pending" | "failed";
    step2: "sent" | "pending" | "failed";
    step3: "sent" | "pending" | "failed";
  };
  smsStatus: "sent" | "pending" | "failed";
}

// Dados de exemplo
const mockData: AbandonedCart[] = [
  {
    id: "AC001",
    name: "João Silva",
    email: "joao.silva@email.com",
    phone: "+55 11 99999-9999",
    address: "Rua das Flores, 123 - São Paulo, SP",
    country: "Brasil",
    gateway: "Stripe",
    products: [],
    emailSequence: { step1: "sent", step2: "sent", step3: "pending" },
    smsStatus: "sent",
  },
  {
    id: "AC002",
    name: "Maria Santos",
    email: "maria.santos@email.com",
    phone: "+351 21 123-4567",
    address: "Rua da Liberdade, 456 - Lisboa, Portugal",
    country: "Portugal",
    gateway: "PayPal",
    products: [],
    emailSequence: { step1: "sent", step2: "pending", step3: "pending" },
    smsStatus: "pending",
  },
  {
    id: "AC003",
    name: "Pedro Costa",
    email: "pedro.costa@email.com",
    phone: "+55 21 88888-8888",
    address: "Av. Copacabana, 789 - Rio de Janeiro, RJ",
    country: "Brasil",
    gateway: "PagSeguro",
    products: [],
    emailSequence: { step1: "sent", step2: "sent", step3: "failed" },
    smsStatus: "failed",
  },
  {
    id: "AC004",
    name: "Ana Oliveira",
    email: "ana.oliveira@email.com",
    phone: "+244 912 345 678",
    address: "Rua da Independência, 321 - Luanda, Angola",
    country: "Angola",
    gateway: "Stripe",
    products: [],
    emailSequence: { step1: "sent", step2: "sent", step3: "sent" },
    smsStatus: "sent",
  },
  {
    id: "AC005",
    name: "Carlos Ferreira",
    email: "carlos.ferreira@email.com",
    phone: "+55 11 77777-7777",
    address: "Rua Augusta, 654 - São Paulo, SP",
    country: "Brasil",
    gateway: "Mercado Pago",
    products: [],
    emailSequence: { step1: "failed", step2: "pending", step3: "pending" },
    smsStatus: "pending",
  },
];

// Componente para status visual
const StatusIcon = ({ status }: { status: "sent" | "pending" | "failed" }) => {
  switch (status) {
    case "sent":
      return <Check className="w-4 h-4 text-green-400" />;
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-400" />;
    case "failed":
      return <X className="w-4 h-4 text-red-400" />;
  }
};

// Componente para sequência de emails
const EmailSequenceStatus = ({
  sequence,
}: {
  sequence: AbandonedCart["emailSequence"];
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Send className="w-3 h-3 text-gray-500" />
        <span className="text-xs text-gray-500">1</span>
        <StatusIcon status={sequence.step1} />
      </div>
      <div className="flex items-center gap-1">
        <Send className="w-3 h-3 text-gray-500" />
        <span className="text-xs text-gray-500">2</span>
        <StatusIcon status={sequence.step2} />
      </div>
      <div className="flex items-center gap-1">
        <Send className="w-3 h-3 text-gray-500" />
        <span className="text-xs text-gray-500">3</span>
        <StatusIcon status={sequence.step3} />
      </div>
    </div>
  );
};

// Componente para status de SMS
const SmsStatus = ({ status }: { status: "sent" | "pending" | "failed" }) => {
  return (
    <div className="flex items-center gap-2">
      <MessageSquare className="w-4 h-4 text-gray-500" />
      <StatusIcon status={status} />
    </div>
  );
};

export function AbandonedCartsTable() {
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations();

  const handleOptionsClick = (cart: AbandonedCart) => {
    setSelectedCart(cart);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-[#1a1a2e]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                {t("common.name")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                {t("abandonedCart.country")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                {t("abandonedCart.gateway")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                {t("abandonedCart.emailStatus")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                {t("abandonedCart.smsStatus")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                {t("abandonedCart.options")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-[#12121f] divide-y divide-gray-800">
            {mockData.map((cart) => (
              <tr
                key={cart.id}
                className="hover:bg-[#1e1e3a] transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                  {cart.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                  {cart.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {cart.country}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-700/50">
                    {cart.gateway}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <EmailSequenceStatus sequence={cart.emailSequence} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <SmsStatus status={cart.smsStatus} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <button
                    onClick={() => handleOptionsClick(cart)}
                    className="p-2 rounded-full hover:bg-[#1a1a2e] transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AbandonedCartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cart={selectedCart}
      />
    </>
  );
}
