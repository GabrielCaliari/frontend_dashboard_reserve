export interface ILeadQualificationMessage {
    id: number;
    analyzed: boolean;
    prompt_token: number;
    completion_token: number;
    json: any;
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