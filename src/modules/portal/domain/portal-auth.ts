export enum ClientRole {
  owner = "owner",
  manager = "manager",
  funcionary = "funcionary",
}

export interface ClientLoginCredentials {
  email: string;
  password: string;
}

export interface PortalTenant {
  id: string;
  name: string;
  slug: string;
  entry_date: string; // ISO date — marco zero, master doc §3.6
}

export interface ClientProfile {
  name: string;
  email: string;
  role: ClientRole;
  tenant: PortalTenant;
}

export interface ClientAuthResponse {
  session_id: string;
  session_token: string;
  details: {
    name: string;
    email: string;
    role: ClientRole;
    tenant: PortalTenant;
  };
}
