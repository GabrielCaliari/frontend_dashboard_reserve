import api from "../../infraestructure/axios/api";
import { errorTypes } from "../../infraestructure/axios/error-types";

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
