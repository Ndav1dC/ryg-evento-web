export type RegistrationType = "asistente" | "lider" | "staff";

export type RegistrationFormData = {
  nombre: string;
  whatsapp: string;
  municipio: string;
  organizacion: string;
  area: string;
  equipos: string;
};

export type RegistrationField = keyof RegistrationFormData;