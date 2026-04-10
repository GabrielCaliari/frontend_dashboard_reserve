import { useQuery } from "@tanstack/react-query";

import api from "@/src/common/config/api";
import { deleteCookie, getCookie } from "cookies-next";
import { useRouter } from "nextjs-toploader/app";

const useAdminDetails = () => {
  const { replace } = useRouter();

  const token = getCookie("token") as string;
  const session = getCookie("session-code") as string;

  const fetchUserData = async () => {
    try {
      const response = await api.get("/admin/me", {
        headers: {
          Authorization: `Bearer ${token}`,
          "session-id": session,
        },
      });
      return response.data;
    } catch (error) {
      deleteCookie("session");
      deleteCookie("token");
      deleteCookie("session_name");
      replace("/auth/login");
      throw error; // Throw error instead of returning undefined
    }
  };

  return useQuery({
    queryKey: ["get-user-data"],
    queryFn: fetchUserData,
    enabled: !!token && !!session,
    staleTime: 5 * 60 * 1000,
  });
};

export default useAdminDetails;
