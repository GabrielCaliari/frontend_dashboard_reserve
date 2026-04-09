import api from "../config/api";
import { errorTypes } from "../config/error-types";

export const completeScreeningService = async ({
  lead_id,
}: {
  lead_id: string;
}) => {
  try {
    const response = await api.post(
      `/auth/leads/${lead_id}/complete-screening`,
    );

    if (response.status === 200) {
      return true;
    }

    return false;
  } catch (error: any) {
    if (error.response.data.code) {
      return error.response.data.code;
    }

    return false;
  }
};
