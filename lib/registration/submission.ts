import "server-only";

import { getRegistrationTypeByCode } from "@/lib/registration/access";
import { getRegistrationEvent } from "@/lib/registration/event";
import {
  leaderOrganizationSchema,
  type RegistrationSubmission,
} from "@/lib/registration/submission-schema";
import { createAdminClient } from "@/lib/supabase/admin";

export class RegistrationSubmissionError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "RegistrationSubmissionError";
  }
}

export async function submitRegistration(
  input: RegistrationSubmission,
): Promise<void> {
  const tipo = getRegistrationTypeByCode(input.codigo);

  if (!tipo) {
    throw new RegistrationSubmissionError(
      "El enlace de inscripción no es válido.",
      404,
    );
  }

  if (tipo === "staff") {
    throw new RegistrationSubmissionError(
      "El registro de staff todavía no está habilitado.",
      403,
    );
  }

  let organizacion: string | null = null;

  if (tipo === "lider") {
    const result = leaderOrganizationSchema.safeParse(
      input.organizacion,
    );

    if (!result.success) {
      throw new RegistrationSubmissionError(
        result.error.issues[0]?.message ??
          "Revisa el nombre de tu iglesia u organización.",
        400,
      );
    }

    organizacion = result.data;
  }

  const evento = await getRegistrationEvent();

  if (!evento.inscripciones_abiertas) {
    throw new RegistrationSubmissionError(
      "Las inscripciones están cerradas en este momento.",
      403,
    );
  }

  const supabase = createAdminClient();

  const {
    data: municipio,
    error: municipalityError,
  } = await supabase
    .from("municipios")
    .select("codigo")
    .eq("codigo", input.municipio)
    .maybeSingle();

  if (municipalityError) {
    console.error("[submitRegistration:municipio]", {
      code: municipalityError.code,
    });

    throw new RegistrationSubmissionError(
      "No fue posible validar el municipio. Intenta nuevamente.",
      500,
    );
  }

  if (!municipio) {
    throw new RegistrationSubmissionError(
      "El municipio seleccionado no existe.",
      400,
    );
  }

  const { error: insertError } = await supabase
    .from("inscripciones")
    .insert({
      evento_id: evento.id,
      tipo,
      nombre_completo: input.nombre,
      whatsapp: input.whatsapp,
      municipio_codigo: municipio.codigo,
      organizacion,
      area_apoyo: null,
      estado: "pendiente",
      respuesta: "sin_respuesta",
    });

  if (insertError) {
    console.error("[submitRegistration:insert]", {
      code: insertError.code,
    });

    throw new RegistrationSubmissionError(
      "No fue posible guardar tu solicitud. Intenta nuevamente.",
      500,
    );
  }
}