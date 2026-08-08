/**
 * `SemesterPlan.eixos` e uma coluna Json livre no Postgres. Na pratica e uma
 * lista de rotulos, mas nada no schema garante isso — por isso a normalizacao
 * mora aqui, num lugar so, em vez de cada componente confiar no formato.
 */
export function normalizeEixos(eixos: unknown): string[] {
  if (Array.isArray(eixos)) {
    return eixos.filter((e): e is string => typeof e === "string");
  }
  return [];
}
