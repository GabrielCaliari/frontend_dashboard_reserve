export interface IDelivery {
  id: number;
  lead_id: number;
  bot_chance: number;
  email_id: number;
  server_response: string;
  send_date: string;
  server_response_date: string;
  open_date: string;
  click_date: string;
  clicked: boolean;
  opened: boolean;
  email_provider: string;
  email_sent_to: string;
  status: number;
  unsubscribe: boolean;
  unsubscribe_date: string;
  created_at: string;
  updated_at: string;
}

export enum EDeliveryStatus {
  pending = 0,
  sent = 1,
  failed = 8,
}
