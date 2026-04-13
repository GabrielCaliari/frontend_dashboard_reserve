import api from "../../infraestructure/axios/api";
import { errorTypes } from "../../infraestructure/axios/error-types";

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
