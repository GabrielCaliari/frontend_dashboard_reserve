import api from "../../infraestructure/axios/api";
import { errorTypes } from "../../infraestructure/axios/error-types";

export const updateLeadQualificationService = async ({
  lead_id,
  card,
}: {
  lead_id: string;
  card: string;
}) => {
  try {
    const response = await api.put(`/auth/leads/${lead_id}/qualification`, {
      card,
    });

    return response.data;
  } catch (error: any) {
    if (error.response.data.code) {
      return error.response.data.code;
    }

    return errorTypes._500.update_lead;
  }
};
