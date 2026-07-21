import api from "@/src/infraestructure/axios/api";
import type { RoiLevel1, RoiLevel2, RoiLevel3, RoiQuery } from "@/src/modules/portal/domain/portal-roi";

export const portalRoiService = {
  async getLevel1(query: RoiQuery): Promise<RoiLevel1> {
    const response = await api.get<RoiLevel1>("/portal/roi/level1", { params: query });
    return response.data;
  },
  async getLevel2(query: RoiQuery): Promise<RoiLevel2> {
    const response = await api.get<RoiLevel2>("/portal/roi/level2", { params: query });
    return response.data;
  },
  async getLevel3(query: RoiQuery): Promise<RoiLevel3> {
    const response = await api.get<RoiLevel3>("/portal/roi/level3", { params: query });
    return response.data;
  },
};
