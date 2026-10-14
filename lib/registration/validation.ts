import { staffAreas } from "@/lib/registration/config";

import type {
  RegistrationFormData,
  RegistrationType,
} from "@/types/registration";

export function validateRegistrationStep(
  tipo: RegistrationType,
  step: number,
  data: RegistrationFormData,
): string | null {
  if (step === 1) {
    if (data.nombre.trim().length < 3) {
      return "Escribe tu nombre completo.";
    }

    const digits = data.whatsapp.replace(/\D/g, "");

    if (digits.length < 10 || digits.length > 13) {
      return "Revisa tu número de WhatsApp.";
    }
  }

  if (step === 2) {
    if (tipo === "staff") {
      if (!staffAreas.some((area) => area === data.area)) {
        return "El área de apoyo debe ser MEDIOS.";
      }

      const equipos = data.equipos.trim();

      if (equipos.length < 3) {
        return (
          "Escribe qué equipos tienes disponibles. " +
          "Si no tienes, escribe “No tengo equipos”."
        );
      }

      if (equipos.length > 1000) {
        return "La descripción no puede superar 1000 caracteres.";
      }
    } else if (!/^\d{5}$/.test(data.municipio)) {
      return "Selecciona un municipio de la lista.";
    }
  }
  return null;
}