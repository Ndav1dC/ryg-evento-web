import type {
  RegistrationFormData,
  RegistrationType,
} from "@/types/registration";

export const initialRegistrationData: RegistrationFormData = {
  nombre: "",
  whatsapp: "",
  municipio: "",
  organizacion: "",
  area: "",
  equipos: "",
  disponibilidadCompleta: false,
};

export const staffAreas = ["MEDIOS"] as const;

export const registrationCopy: Record<
  RegistrationType,
  {
    title: string;
    description: string;
  }
> = {
  asistente: {
    title: "asistentes",
    description: "Nos alegra que seas parte de este encuentro.",
  },
  lider: {
    title: "líderes",
    description: "Queremos darte la bienvenida y conocer de dónde vienes.",
  },
  staff: {
    title: "staff",
    description:
      "Gracias por poner tus talentos al servicio de este encuentro.",
  },
};

export function getLastStep(tipo: RegistrationType): number {
  return tipo === "lider" ? 4 : 3;
}