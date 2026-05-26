export function formatStatValue(value: number | string, unit?: string): string {
 if (typeof value !=='number') {
 return String(value);
 }

 if (unit ==='%') {
 return`${value.toLocaleString('pt-BR', {
 maximumFractionDigits: value % 1 === 0 ? 0 : 1,
 })}%`;
 }

 if (unit ==='bytes') {
 const units = ['B','KB','MB','GB','TB'];
 let currentValue = value;
 let unitIndex = 0;

 while (currentValue >= 1024 && unitIndex < units.length - 1) {
 currentValue /= 1024;
 unitIndex += 1;
 }

 return`${currentValue.toLocaleString('pt-BR', {
 maximumFractionDigits: currentValue >= 10 ? 0 : 1,
 })} ${units[unitIndex]}`;
 }

 if (!unit || unit ==='count') {
 return value.toLocaleString('pt-BR', {
 maximumFractionDigits: value % 1 === 0 ? 0 : 2,
 });
 }

 return`${value.toLocaleString('pt-BR', {
 maximumFractionDigits: value % 1 === 0 ? 0 : 2,
 })} ${unit}`;
}