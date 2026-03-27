// Report Types — Analytics Reports module (super_admin only)

export interface Report {
  id: string;           // cuid
  phone: string;
  url: string;
  label: string | null;
  createdAt: string;    // ISO date
  updatedAt: string;    // ISO date
}

export interface CreateReportDto {
  phone: string;
  url: string;
  label?: string;
}

export interface UpdateReportDto {
  phone?: string;
  url?: string;
  label?: string;
}

export interface ReportsListResponse {
  data: Report[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
