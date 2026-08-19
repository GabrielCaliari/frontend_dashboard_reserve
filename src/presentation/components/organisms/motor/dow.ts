// Bitmask da spec: seg=1 ... dom=64.
export const DOW_OPTIONS = [
  { bit: 1, label: "Seg" },
  { bit: 2, label: "Ter" },
  { bit: 4, label: "Qua" },
  { bit: 8, label: "Qui" },
  { bit: 16, label: "Sex" },
  { bit: 32, label: "Sáb" },
  { bit: 64, label: "Dom" },
];

export function dowLabel(mask: number): string {
  if (mask === 127) return "Todos os dias";
  return DOW_OPTIONS.filter((d) => mask & d.bit)
    .map((d) => d.label)
    .join(", ");
}
