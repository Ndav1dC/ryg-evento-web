import { staffAreas } from "@/lib/registration/config";
import { municipalities } from "@/lib/registration/municipalities";
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
        return "Selecciona el área donde apoyarás.";
      }
    } else if (!municipalities.some((item) => item === data.municipio)) {
      return "Selecciona un municipio de la lista.";
    }
  }

  if (tipo === "lider" && step === 3) {
    if (!data.organizacion.trim()) {
      return "Escribe el nombre de tu iglesia u organización.";
    }
  }

  return null;
}