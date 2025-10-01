import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Reader, TReaderDocument } from '@usewaypoint/email-builder';
import { z } from 'zod';
import { getTimeZones } from '@vvo/tzdb';

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  templateName: string;
  emailStatus: 'sent' | 'pending' | 'failed';
  initialData?: {
    subject?: string;
    preheader?: string;
    sender?: string;
    provider?: string;
    sendAfterHours?: number;
    content?: any[];
  };
}

const emailSchema = z.object({
  subject: z.string().min(1, 'O assunto é obrigatório'),
  preheader: z.string().min(1, 'O pré-header é obrigatório'),
  sender: z.string().email('O remetente deve ser um email válido'),
  provider: z.string().min(1, 'O provedor é obrigatório'),
  sendAfterHours: z.number().min(0, 'O tempo de envio deve ser maior que 0'),
  content: z.string().min(1, 'O conteúdo do email é obrigatório'),
  timeZone: z.string().min(1, 'O fuso horário é obrigatório'),
  time: z.string().min(1, 'O horário é obrigatório')
});

const timeZones = getTimeZones();

export function EmailTemplateModal({
  isOpen,
  onClose,
  templateId,
  templateName,
  emailStatus,
  initialData
}: EmailTemplateModalProps) {
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [preheader, setPreheader] = useState(initialData?.preheader || '');
  const [sender, setSender] = useState(initialData?.sender || '');
  const [provider, setProvider] = useState(initialData?.provider || '');
  const [sendAfterHours, setSendAfterHours] = useState(initialData?.sendAfterHours || 24);
  const [content, setContent] = useState<string>(Array.isArray(initialData?.content) ? initialData.content.join('') : initialData?.content || '');
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
  const [timeZone, setTimeZone] = useState('America/Sao_Paulo');
  const [time, setTime] = useState('');

  const defaultDocument: TReaderDocument = {
    root: {
      type: 'EmailLayout',
      data: {
        backdropColor: '#F8F8F8',
        canvasColor: '#FFFFFF',
        textColor: '#242424',
        fontFamily: 'MODERN_SANS',
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
      time
    };

    const result = emailSchema.safeParse(formData);
    if (!result.success) {
      const newErrors = Object.fromEntries(
        Object.entries(result.error.format()).map(([key, value]) => [key, value && '_errors' in value ? value._errors[0] : undefined])
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
      time
    };

    console.log('Email configurado:', emailData);
    // Aqui você implementará a lógica para salvar o template e configurações
    onClose();
  };

  // Ajuste no padrão de disparo dos emails
  const emailDispatchOptions = [
    { label: 'Imediato', value: 0 },
    { label: '24 horas', value: 24 },
    { label: '48 horas', value: 48 }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {emailStatus === 'sent' ? 'Visualizar Email' : 'Configurar Email'}: {templateName}
            </h3>
            {emailStatus !== 'sent' && (
              <p className="text-sm text-gray-600 mt-1">
                Configure o conteúdo e as opções de envio deste email
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Configurações do Email */}
        <div className="p-6 space-y-6">
          {emailStatus !== 'sent' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assunto do Email
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Não perca os itens do seu carrinho!"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pré-header
                </label>
                <input
                  type="text"
                  value={preheader}
                  onChange={(e) => setPreheader(e.target.value)}
                  placeholder="Ex: Veja o que você deixou para trás..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.preheader && (
                  <p className="mt-1 text-sm text-red-600">{errors.preheader}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remetente
                </label>
                <input
                  type="text"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="Ex: loja@exemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.sender && (
                  <p className="mt-1 text-sm text-red-600">{errors.sender}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provedor de Email
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione um provedor</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailchimp">Mailchimp</option>
                  <option value="aws-ses">AWS SES</option>
                  {/* Adicione mais provedores conforme necessário */}
                </select>
                {errors.provider && (
                  <p className="mt-1 text-sm text-red-600">{errors.provider}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enviar Após (horas)
                </label>
                <select
                  value={sendAfterHours}
                  onChange={(e) => setSendAfterHours(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {emailDispatchOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors.sendAfterHours && (
                  <p className="mt-1 text-sm text-red-600">{errors.sendAfterHours}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuso Horário
                </label>
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {timeZones.map((tz: { name: string }) => (
                    <option key={tz.name} value={tz.name}>{tz.name}</option>
                  ))}
                </select>
                {errors.timeZone && (
                  <p className="mt-1 text-sm text-red-600">{errors.timeZone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.time && (
                  <p className="mt-1 text-sm text-red-600">{errors.time}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conteúdo do Email
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Insira o HTML do email aqui..."
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
          </div>

          <div className="mt-4 p-4 border border-gray-300 rounded-md">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            {emailStatus === 'sent' ? 'Fechar' : 'Cancelar'}
          </button>
          {emailStatus !== 'sent' && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Salvar e Agendar
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 