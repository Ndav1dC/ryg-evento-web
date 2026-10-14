import "server-only";

import { z } from "zod";

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeWhatsapp(value: string): string {
  const compact = value.trim().replace(/[\s().-]/g, "");

  if (/^3\d{9}$/.test(compact)) {
    return `+57${compact}`;
  }

  if (/^573\d{9}$/.test(compact)) {
    return `+${compact}`;
  }

  return compact;
}

export const registrationSubmissionSchema = z
  .object({
    codigo: z
      .string()
      .min(1, "El enlace de inscripción no es válido.")
      .max(256, "El enlace de inscripción no es válido."),

    nombre: z
      .string()
      .max(300, "El nombre es demasiado largo.")
      .transform(normalizeText)
      .pipe(
        z
          .string()
          .min(3, "Escribe tu nombre completo.")
          .max(150, "El nombre no puede superar 150 caracteres."),
      ),

    whatsapp: z
      .string()
      .max(40, "Revisa el número de WhatsApp.")
      .transform(normalizeWhatsapp)
      .pipe(
        z.string().regex(
          /^\+573\d{9}$/,
          "Escribe un celular colombiano válido de 10 dígitos.",
        ),
      ),

    municipio: z
      .string()
      .trim()
      .regex(/^\d{5}$/, "Selecciona un municipio válido."),

    organizacion: z
      .string()
      .max(400, "El nombre de la organización es demasiado largo.")
      .transform(normalizeText)
      .pipe(
        z
          .string()
          .max(
            200,
            "La iglesia u organización no puede superar 200 caracteres.",
          ),
      )
      .optional()
      .default(""),
  })
  .strict();

export type RegistrationSubmission = z.infer<
  typeof registrationSubmissionSchema
>;

export const leaderOrganizationSchema = z
  .string()
  .min(2, "Escribe el nombre de tu iglesia u organización.")
  .max(
    200,
    "La iglesia u organización no puede superar 200 caracteres.",
  );