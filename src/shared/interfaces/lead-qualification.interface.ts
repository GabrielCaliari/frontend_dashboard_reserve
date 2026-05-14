export enum ETemperature {
  hot = 1,
  warm = 2,
  cold = 3,
  undetermined = 8,
}

export interface ILeadQualificationMessage {
  id: number;
  analyzed: boolean;
  prompt_token: number;
  completion_token: number;
  temperature: ETemperature;
  json: any;
  screening_complete: boolean;
  profile_name: string;
  phone_number_id: string;
  phone_number: string;
  type: string;
  kb_card: string;
  message: string;
  message_date: string;
  created_at: string;
  updated_at: string;
}

export interface IUpdateCardLeadQualificationMessage {
  id: number;
  card: string;
}
