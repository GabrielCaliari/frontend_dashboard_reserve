import api from "../config/api";
import { errorTypes } from "../config/error-types";

export const listLeadQualificationService = async () => {
  try {
    const response = await api.get(`/auth/leads/qualification`);

    return response.data;
  } catch (error: any) {
    if (error.response.data.code) {
      return error.response.data.code;
    }

    return errorTypes._500.list_trademark_registration_leads;
  }
};
