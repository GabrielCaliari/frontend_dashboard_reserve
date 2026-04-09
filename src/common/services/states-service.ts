import { City, State } from "../interfaces/states.interface";

export const fetchStates = async (): Promise<State[]> => {
  try {
    const response = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados",
    );
    const data: State[] = await response.json();
    return data.sort((a, b) => a.nome.localeCompare(b.nome));
  } catch (error) {
    console.error("Erro ao buscar estados:", error);
    throw error;
  }
};

export const fetchCities = async (stateSigla: string): Promise<City[]> => {
  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateSigla}/municipios`,
    );
    const data: City[] = await response.json();
    return data.sort((a, b) => a.nome.localeCompare(b.nome));
  } catch (error) {
    console.error("Erro ao buscar cidades:", error);
    throw error;
  }
};
