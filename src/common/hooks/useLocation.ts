import { useState, useEffect } from "react";
import { fetchStates, fetchCities } from "@/src/common/services/states-service";
import { State, City } from "@/src/interfaces/states.interface";

export const useLocation = () => {
    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [selectedState, setSelectedState] = useState<string | undefined>();

    useEffect(() => {
        const loadStates = async () => {
            try {
                const statesData = await fetchStates();
                setStates(statesData);
            } catch (error) {
                console.error("Erro ao carregar estados:", error);
            }
        };
        loadStates();
    }, []);

    useEffect(() => {
        if (!selectedState) return;

        const loadCities = async () => {
            try {
                const citiesData = await fetchCities(selectedState);
                setCities(citiesData);
            } catch (error) {
                console.error("Erro ao carregar cidades:", error);
            }
        };
        loadCities();
    }, [selectedState]);

    return { states, cities, selectedState, setSelectedState };
};
