import { z } from "zod";

const storedPayloadSchema = z.object({
  solicitud_id: z.string().uuid(),
  nombre: z.string().max(300),
  whatsapp: z.string().max(40),

  municipio: z
    .string()
    .refine(
      (value) => value === "" || /^\d{5}$/.test(value),
    ),

  organizacion: z.string().max(400),

  equipos: z
    .string()
    .max(2000)
    .optional()
    .default(""),

  disponibilidad_completa: z
    .boolean()
    .optional()
    .default(false),
});

const submissionSessionSchema = z.discriminatedUnion("status", [
  z.object({
    version: z.literal(1),
    status: z.literal("pending"),
    payload: storedPayloadSchema,
  }),
  z.object({
    version: z.literal(1),
    status: z.literal("received"),
  }),
]);

export type StoredSubmissionPayload = z.infer<
  typeof storedPayloadSchema
>;

export type SubmissionSession = z.infer<
  typeof submissionSessionSchema
>;

export type SubmissionPayload = StoredSubmissionPayload & {
  codigo: string;
};

function getSessionKey(codigo: string): string {
  return `ryg:registration:v1:${encodeURIComponent(codigo)}`;
}

export function readSubmissionSession(
  codigo: string,
): SubmissionSession | null {
  const raw = window.sessionStorage.getItem(
    getSessionKey(codigo),
  );

  if (raw === null) {
    return null;
  }

  return submissionSessionSchema.parse(JSON.parse(raw));
}

export function savePendingSubmission(
  payload: SubmissionPayload,
): void {
  const session: SubmissionSession = {
    version: 1,
    status: "pending",
    payload: {
      solicitud_id: payload.solicitud_id,
      nombre: payload.nombre,
      whatsapp: payload.whatsapp,
      municipio: payload.municipio,
      organizacion: payload.organizacion,
      equipos: payload.equipos,
      disponibilidad_completa:
        payload.disponibilidad_completa,
    },
  };

  window.sessionStorage.setItem(
    getSessionKey(payload.codigo),
    JSON.stringify(session),
  );
}

export function saveReceivedSubmission(
  codigo: string,
): void {
  const session: SubmissionSession = {
    version: 1,
    status: "received",
  };

  window.sessionStorage.setItem(
    getSessionKey(codigo),
    JSON.stringify(session),
  );
}

export function clearSubmissionSession(
  codigo: string,
): void {
  window.sessionStorage.removeItem(getSessionKey(codigo));
}