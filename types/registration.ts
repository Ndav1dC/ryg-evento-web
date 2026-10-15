export type RegistrationType = "asistente" | "lider" | "staff";

export type RegistrationFormData = {
  nombre: string;
  whatsapp: string;
  municipio: string;
  organizacion: string;
  area: string;
  equipos: string;
  disponibilidadCompleta: boolean;
};

export type RegistrationField = Exclude<
  keyof RegistrationFormData,
  "disponibilidadCompleta"
>;