export interface ICreateEmailCampaign {
  name: string;
}

export enum ECopyVariationType {
  ai = 1,
  manual = 2,
}

export interface ICampaignConfig {
  leadsUploaded: boolean;
  copyCreated: boolean;
  aiVariationConfigured: boolean;
  batchSizeConfirmed: boolean;
  funnelConfigured: boolean;
  variationType?: "ai" | "manual";
  funnelType?: "single" | "funnel";
  funnel?: IFunnel;
}

export interface IFunnelStep {
  id: string;
  name: string;
  type: "email" | "condition" | "delay";
  content?: {
    subject?: string;
    body?: string;
  };
  condition?: {
    type: "opened" | "clicked";
    target?: string;
  };
  delay?: {
    days: number;
    hours: number;
  };
  children: string[];
}

export interface IFunnel {
  steps: IFunnelStep[];
  rootStepId: string;
}

export interface IUploadLeads {
  campaignId: string;
  emails: string[];
}

export interface IEmailCampaign {
  id: number;
  name: string;
  total_leads: number;
  open_rate: number;
  click_rate: number;
  campaign_batch_size: number;
  uploaded_leads: boolean;
  copy_variation_type: number;
  funnel_campaign: boolean;
  main_email_id: number;
  status: number;
  started_at: string;
  finished_at: string;
  smtp_server_id: number;
  created_at: string;
  updated_at: string;
}
