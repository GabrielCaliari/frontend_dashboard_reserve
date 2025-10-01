'use client'

import { useState } from "react";
import { X, Code, Send, Clock, CheckCircle, XCircle, Eye, RefreshCw, Calendar, Mail, MousePointer, ExternalLink } from "lucide-react";
import { EmailTemplateModal } from './email-template-modal';

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
    step1: 'sent' | 'pending' | 'failed';
    step2: 'sent' | 'pending' | 'failed';
    step3: 'sent' | 'pending' | 'failed';
  };
  smsStatus: 'sent' | 'pending' | 'failed';
  paymentProviderData?: any;
}

interface AbandonedCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: AbandonedCart | null;
}

export function AbandonedCartModal({ isOpen, onClose, cart }: AbandonedCartModalProps) {
  const [activeTab, setActiveTab] = useState('info');
  const [showProductsJson, setShowProductsJson] = useState(false);
  const [showOriginJson, setShowOriginJson] = useState(false);
  const [showEmailJson, setShowEmailJson] = useState<number | null>(null);
  const [showClickedLinks, setShowClickedLinks] = useState<number | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    id: string;
    name: string;
    status: 'sent' | 'pending' | 'failed';
    data?: {
      subject?: string;
      sendAfterHours?: number;
      content?: any[];
    };
  } | null>(null);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');

  if (!isOpen || !cart) return null;

  // Dados mockados mais completos para demonstração
  const mockCartData: AbandonedCart = {
    ...cart,
    email: "joao.silva@email.com",
    phone: "+55 11 99999-9999",
    address: "Rua das Flores, 123 - São Paulo, SP",
    products: [
      { id: "PROD001", name: "Smartphone Samsung Galaxy", price: 1299.99 },
      { id: "PROD002", name: "Capinha Protetora", price: 49.90 },
      { id: "PROD003", name: "Película de Vidro", price: 29.90 }
    ],
    accessOrigin: {
      agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      ip: "192.168.1.100"
    },
    paymentProviderData: {
      session_id: "cs_test_123456789",
      customer: {
        id: "cus_123456",
        email: "joao.silva@email.com",
        name: "João Silva"
      },
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Smartphone Samsung Galaxy"
            },
            unit_amount: 129999
          },
          quantity: 1
        }
      ],
      metadata: {
        cart_id: cart.id,
        source: "website"
      }
    }
  };

  const totalPrice = mockCartData.products.reduce((sum, product) => sum + product.price, 0);

  const tabs = [
    { id: 'info', label: 'Informações do Lead' },
    { id: 'emails', label: 'Emails' },
    { id: 'sms', label: 'SMS' },
    { id: 'actions', label: 'Ações' },
    { id: 'history', label: 'Histórico' }
  ];

  const handleEditTemplate = (
    templateId: string, 
    templateName: string, 
    status: 'sent' | 'pending' | 'failed',
    existingData?: {
      subject?: string;
      sendAfterHours?: number;
      content?: any[];
    }
  ) => {
    setSelectedTemplate({ 
      id: templateId, 
      name: templateName, 
      status,
      data: existingData
    });
    setIsTemplateModalOpen(true);
  };

  const handleSendSms = () => {
    if (window.confirm('Você tem certeza que deseja enviar este SMS?')) {
      console.log('SMS enviado:', smsMessage);
      setIsSmsModalOpen(false);
    }
  };

  const renderInfoTab = () => (
    <div className="space-y-6">
      {/* Informações Pessoais */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Informações Pessoais</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Nome</label>
            <p className="text-gray-900">{mockCartData.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <p className="text-gray-900">{mockCartData.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
            <p className="text-gray-900">{mockCartData.phone}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">Endereço</label>
            <p className="text-gray-900">{mockCartData.address}</p>
          </div>
        </div>
      </div>

      {/* Produtos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900">Produtos</h4>
          <button
            onClick={() => setShowProductsJson(!showProductsJson)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Code className="w-4 h-4" />
            {showProductsJson ? 'Ocultar JSON' : 'Ver JSON'}
          </button>
        </div>
        
        {showProductsJson ? (
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
            <pre>{JSON.stringify(mockCartData.products, null, 2)}</pre>
          </div>
        ) : (
          <div className="space-y-3">
            {mockCartData.products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">ID: {product.id}</p>
                </div>
                <p className="font-semibold text-gray-900">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </p>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Total:</span>
              <span className="font-bold text-lg text-gray-900">
                R$ {totalPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Origem de Acesso */}
      {mockCartData.accessOrigin && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Origem de Acesso</h4>
            <button
              onClick={() => setShowOriginJson(!showOriginJson)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Code className="w-4 h-4" />
              {showOriginJson ? 'Ocultar JSON' : 'Ver JSON'}
            </button>
          </div>
          
          {showOriginJson ? (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
              <pre>{JSON.stringify(mockCartData.paymentProviderData, null, 2)}</pre>
            </div>
          ) : (
            <div className="space-y-2">
              {mockCartData.accessOrigin.ip && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">IP</label>
                  <p className="text-gray-900 font-mono text-sm">{mockCartData.accessOrigin.ip}</p>
                </div>
              )}
              {mockCartData.accessOrigin.agent && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">User Agent</label>
                  <p className="text-gray-900 font-mono text-sm break-all">
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
        title: "Email 1 - Lembrete Inicial",
        status: mockCartData.emailSequence.step1,
        sentAt: mockCartData.emailSequence.step1 === 'sent' ? "2024-01-15 14:30" : null,
        subject: "Você esqueceu alguns itens no seu carrinho!",
        template: "abandoned_cart_reminder_1",
        opened: mockCartData.emailSequence.step1 === 'sent' ? true : false,
        openedAt: mockCartData.emailSequence.step1 === 'sent' ? "2024-01-15 15:45" : null,
        clicked: mockCartData.emailSequence.step1 === 'sent' ? true : false,
        clickedAt: mockCartData.emailSequence.step1 === 'sent' ? "2024-01-15 16:20" : null,
        clickedLinks: mockCartData.emailSequence.step1 === 'sent' ? [
          { url: "https://loja.com/carrinho", text: "Finalizar Compra", clickedAt: "2024-01-15 16:20" },
          { url: "https://loja.com/produto/smartphone", text: "Ver Produto", clickedAt: "2024-01-15 16:22" }
        ] : [],
        providerResponse: {
          messageId: "msg_1234567890",
          provider: "SendGrid",
          status: "delivered",
          deliveredAt: "2024-01-15 14:31:23",
          events: [
            { event: "processed", timestamp: "2024-01-15 14:30:45" },
            { event: "delivered", timestamp: "2024-01-15 14:31:23" },
            { event: "open", timestamp: "2024-01-15 15:45:12" },
            { event: "click", timestamp: "2024-01-15 16:20:34" }
          ]
        }
      },
      {
        id: 2,
        title: "Email 2 - Desconto Especial",
        status: mockCartData.emailSequence.step2,
        sentAt: mockCartData.emailSequence.step2 === 'sent' ? "2024-01-16 10:15" : null,
        subject: "🎁 Oferta especial: 10% de desconto nos seus produtos!",
        template: "abandoned_cart_discount_10",
        opened: mockCartData.emailSequence.step2 === 'sent' ? true : false,
        openedAt: mockCartData.emailSequence.step2 === 'sent' ? "2024-01-16 11:30" : null,
        clicked: mockCartData.emailSequence.step2 === 'sent' ? false : false,
        clickedAt: null,
        clickedLinks: [],
        providerResponse: {
          messageId: "msg_2345678901",
          provider: "SendGrid",
          status: mockCartData.emailSequence.step2 === 'sent' ? "delivered" : "pending",
          deliveredAt: mockCartData.emailSequence.step2 === 'sent' ? "2024-01-16 10:16:45" : null
        }
      },
      {
        id: 3,
        title: "Email 3 - Última Chance",
        status: mockCartData.emailSequence.step3,
        sentAt: mockCartData.emailSequence.step3 === 'sent' ? "2024-01-17 16:45" : null,
        subject: "⏰ Última chance! Seus produtos estão quase esgotando",
        template: "abandoned_cart_final_warning",
        opened: mockCartData.emailSequence.step3 === 'sent' ? false : false,
        openedAt: null,
        clicked: false,
        clickedAt: null,
        clickedLinks: [],
        providerResponse: {
          messageId: mockCartData.emailSequence.step3 === 'sent' ? "msg_3456789012" : null,
          provider: "SendGrid",
          status: mockCartData.emailSequence.step3 === 'failed' ? "bounced" : mockCartData.emailSequence.step3,
          error: mockCartData.emailSequence.step3 === 'failed' ? "Invalid email address" : null
        }
      }
    ];

    const getStatusIcon = (status: 'sent' | 'pending' | 'failed') => {
      switch (status) {
        case 'sent':
          return <CheckCircle className="w-5 h-5 text-green-600" />;
        case 'pending':
          return <Clock className="w-5 h-5 text-yellow-600" />;
        case 'failed':
          return <XCircle className="w-5 h-5 text-red-600" />;
      }
    };

    const getStatusText = (status: 'sent' | 'pending' | 'failed') => {
      switch (status) {
        case 'sent':
          return 'Enviado';
        case 'pending':
          return 'Pendente';
        case 'failed':
          return 'Falhou';
      }
    };

    const getStatusColor = (status: 'sent' | 'pending' | 'failed') => {
      switch (status) {
        case 'sent':
          return 'bg-green-100 text-green-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        case 'failed':
          return 'bg-red-100 text-red-800';
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">Sequência de Emails</h4>
          <div className="text-sm text-gray-600">
            Total de emails: {emailSequences.length}
          </div>
        </div>

        {emailSequences.map((email) => (
          <div key={email.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(email.status)}
                <div>
                  <h5 className="font-medium text-gray-900">{email.title}</h5>
                  <p className="text-sm text-gray-600">{email.subject}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(email.status)}`}>
                {getStatusText(email.status)}
              </span>
            </div>

            {email.status === 'sent' && (
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Enviado em</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">{email.sentAt}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Status de Abertura</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      {email.opened ? (
                        <div>
                          <span className="text-sm font-semibold text-green-600">Aberto</span>
                          <p className="text-xs text-gray-500">{email.openedAt}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Não aberto</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Status de Clique</label>
                    <div className="flex items-center gap-2">
                      <MousePointer className="w-4 h-4 text-gray-500" />
                      {email.clicked ? (
                        <div>
                          <span className="text-sm font-semibold text-blue-600">Clicou</span>
                          <p className="text-xs text-gray-500">{email.clickedAt}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Não clicou</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Links Clicados */}
                {email.clicked && email.clickedLinks.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h6 className="font-medium text-blue-900">Links Clicados</h6>
                      <button
                        onClick={() => setShowClickedLinks(showClickedLinks === email.id ? null : email.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showClickedLinks === email.id ? 'Ocultar' : 'Ver Detalhes'}
                      </button>
                    </div>
                    
                    {showClickedLinks === email.id && (
                      <div className="space-y-2">
                        {email.clickedLinks.map((link, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                            <div className="flex items-center gap-2">
                              <ExternalLink className="w-4 h-4 text-blue-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{link.text}</p>
                                <p className="text-xs text-gray-500">{link.url}</p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">{link.clickedAt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {email.status === 'failed' && (
              <div className="p-4 bg-red-50 rounded-lg mb-4">
                <p className="text-sm text-red-700">
                  <strong>Erro:</strong> {email.providerResponse.error || "Falha no envio - Email inválido ou servidor indisponível"}
                </p>
              </div>
            )}

            {/* JSON do Provedor */}
            {showEmailJson === email.id && (
              <div className="mb-4">
                <h6 className="font-medium text-gray-900 mb-2">Resposta do Provedor de Email</h6>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                  <pre>{JSON.stringify(email.providerResponse, null, 2)}</pre>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => handleEditTemplate(
                  email.template,
                  email.title,
                  email.status,
                  email.status === 'sent' ? {
                    subject: email.subject,
                    sendAfterHours: 24, // você pode ajustar isso baseado na sua lógica
                    content: [] // aqui você pode passar o conteúdo existente se disponível
                  } : undefined
                )}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                {email.status === 'sent' ? 'Visualizar Template' : 'Configurar Email'}
              </button>

              {email.status === 'sent' && (
                <button
                  onClick={() => console.log(`Reenviar email ${email.id}`)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reenviar
                </button>
              )}

              {(email.status === 'pending' || email.status === 'failed') && (
                <button
                  onClick={() => console.log(`Enviar agora email ${email.id}`)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {email.status === 'pending' ? 'Enviar Agora' : 'Tentar Novamente'}
                </button>
              )}

              <button
                onClick={() => setShowEmailJson(showEmailJson === email.id ? null : email.id)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Code className="w-4 h-4" />
                {showEmailJson === email.id ? 'Ocultar JSON' : 'Ver JSON do Provedor'}
              </button>
            </div>
          </div>
        ))}

        <div className="p-4 bg-blue-50 rounded-lg">
          <h6 className="font-medium text-blue-900 mb-2">Configurações da Sequência</h6>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Email 1: Enviado imediatamente após abandono</p>
            <p>• Email 2: Enviado 24h após o primeiro email</p>
            <p>• Email 3: Enviado 48h após o segundo email</p>
          </div>
        </div>
      </div>
    );
  };

  const renderSmsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Sequência de SMS</h4>
        <div className="text-sm text-gray-600">
          Total de SMS: {mockCartData.smsStatus === 'sent' ? 1 : 0}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mensagem
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enviado em
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                {mockCartData.smsStatus === 'sent' ? 'Enviado' : 'Pendente'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                Lembrete de carrinho abandonado
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {mockCartData.smsStatus === 'sent' ? '2024-01-15 14:30' : '---'}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4">
          <button
            onClick={() => setIsSmsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
            Disparar SMS Avulso
          </button>
        </div>
      </div>

      {isSmsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Enviar SMS Avulso</h3>
              <button
                onClick={() => setIsSmsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="Digite sua mensagem aqui..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSendSms}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Enviar SMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return renderInfoTab();
      case 'emails':
        return renderEmailsTab();
      case 'sms':
        return renderSmsTab();
      case 'actions':
        return <div className="p-8 text-center text-gray-500">Aba de ações em desenvolvimento...</div>;
      case 'history':
        return <div className="p-8 text-center text-gray-500">Aba de histórico em desenvolvimento...</div>;
      default:
        return renderInfoTab();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Carrinho #{cart.id} - {cart.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Fechar
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