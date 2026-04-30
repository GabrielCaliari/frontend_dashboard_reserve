import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStates, fetchCities } from "@/src/common/services/states-service";
import { State, City } from "@/src/common/interfaces/states.interface";

export const useLocation = () => {
  const [selectedState, setSelectedState] = useState<string | undefined>();

  const { data: states = [] } = useQuery<State[]>({
    queryKey: ["states"],
    queryFn: fetchStates,
    staleTime: Infinity, // estados raramente mudam
  });

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["cities", selectedState],
    queryFn: () => fetchCities(selectedState!),
    enabled: !!selectedState,
    staleTime: 5 * 60 * 1000,
  });

  return { states, cities, selectedState, setSelectedState };
};
