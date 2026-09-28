export const municipalities = [
  "Cali — Valle del Cauca",
  "Palmira — Valle del Cauca",
  "Jamundí — Valle del Cauca",
  "Yumbo — Valle del Cauca",
  "Medellín — Antioquia",
  "Bogotá — Bogotá D.C.",
  "Barranquilla — Atlántico",
  "Bucaramanga — Santander",
  "Cartagena de Indias — Bolívar",
  "Pereira — Risaralda",
  "Manizales — Caldas",
  "Popayán — Cauca",
  "Pasto — Nariño",
] as const;

export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}