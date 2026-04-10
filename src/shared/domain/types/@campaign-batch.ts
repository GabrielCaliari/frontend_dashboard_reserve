export interface CampaignBatch {
  id: number;
  total_leads: number;
  un_open_rate: number;
  un_click_rate: number;
  un_unsubscribe: number;
  un_success_rate: number | null;
  un_failed_rate: number | null;
  email_id: number;
  status: number;
  started_at: string;
  finished_at: string;
  created_at: string;
  updated_at: string;
}
