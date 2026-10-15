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
    solicitud_id: z
      .string()
      .uuid("La clave de la solicitud no es válida.")
      .transform((value) => value.toLowerCase()),

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
          .max(
            150,
            "El nombre no puede superar 150 caracteres.",
          ),
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
      .refine(
        (value) => value === "" || /^\d{5}$/.test(value),
        "Selecciona un municipio válido.",
      )
      .optional()
      .default(""),

    organizacion: z
      .string()
      .max(
        400,
        "El nombre de la organización es demasiado largo.",
      )
      .transform(normalizeText)
      .pipe(
        z.string().max(
          200,
          "La iglesia u organización no puede superar 200 caracteres.",
        ),
      )
      .optional()
      .default(""),

    equipos: z
      .string()
      .max(
        2000,
        "La descripción de los equipos es demasiado larga.",
      )
      .transform(normalizeText)
      .pipe(
        z.string().max(
          1000,
          "La descripción de equipos no puede superar 1000 caracteres.",
        ),
      )
      .optional()
      .default(""),

    disponibilidad_completa: z
      .boolean()
      .optional()
      .default(false),
  })
  .strict();

export type RegistrationSubmission = z.infer<
  typeof registrationSubmissionSchema
>;

export const leaderOrganizationSchema = z
  .string()
  .min(
    2,
    "Escribe el nombre de tu iglesia u organización.",
  )
  .max(
    200,
    "La iglesia u organización no puede superar 200 caracteres.",
  );

export const staffEquipmentSchema = z
  .string()
  .min(
    3,
    "Escribe qué equipos tienes disponibles. " +
      "Si no tienes, escribe “No tengo equipos”.",
  )
  .max(
    1000,
    "La descripción de equipos no puede superar 1000 caracteres.",
  );