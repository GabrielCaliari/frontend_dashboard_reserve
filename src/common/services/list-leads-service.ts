import api from "../config/api";
import { errorTypes } from "../config/error-types";

export const listLeadsService = async ({ page = 1 }: { page?: number }) => {
  try {
    const response = await api.get("/auth/leads", {
      params: {
        page,
      },
    });

    if (response.status !== 200) {
      throw response.data;
    }

    return response.data;
  } catch (error: any) {
    if (error.response.data.code) {
      return error.response.data.code;
    }

    return errorTypes._500.list_leads;
  }
};
