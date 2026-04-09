export interface ISmtpServer {
  id: number;
  name: string;
  domain: string;
  email: string;
  provider: string;
  default: boolean;
  created_at: Date;
  updated_at: Date;
}
