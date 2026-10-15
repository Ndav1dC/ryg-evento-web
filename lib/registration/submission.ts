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

type SubmissionResult = {
  repeated: boolean;
};

type ComparableRegistration = {
  tipo: string;
  nombre_completo: string;
  whatsapp: string;
  municipio_codigo: string | null;
  organizacion: string | null;
  area_apoyo: string | null;
};

function assertSameSubmission(
  existing: ComparableRegistration,
  expected: ComparableRegistration,
): void {
  const matches =
    existing.tipo === expected.tipo &&
    existing.nombre_completo === expected.nombre_completo &&
    existing.whatsapp === expected.whatsapp &&
    existing.municipio_codigo === expected.municipio_codigo &&
    existing.organizacion === expected.organizacion &&
    existing.area_apoyo === expected.area_apoyo;

  if (!matches) {
    throw new RegistrationSubmissionError(
      "Esta clave ya pertenece a una solicitud con otros datos. " +
        "Inicia una nueva inscripción.",
      409,
    );
  }
}

export async function submitRegistration(
  input: RegistrationSubmission,
): Promise<SubmissionResult> {
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
  const supabase = createAdminClient();

  const expected: ComparableRegistration = {
    tipo,
    nombre_completo: input.nombre,
    whatsapp: input.whatsapp,
    municipio_codigo: input.municipio,
    organizacion,
    area_apoyo: null,
  };

  async function findExistingSubmission() {
    const { data, error } = await supabase
      .from("inscripciones")
      .select(
        "tipo, nombre_completo, whatsapp, municipio_codigo, " +
          "organizacion, area_apoyo",
      )
      .eq("evento_id", evento.id)
      .eq("solicitud_id", input.solicitud_id)
      .maybeSingle();

    if (error) {
      console.error("[submitRegistration:findExisting]", {
        code: error.code,
      });

      throw new RegistrationSubmissionError(
        "No fue posible comprobar tu solicitud. Intenta nuevamente.",
        500,
      );
    }

    return data as ComparableRegistration | null;
  }

  const existing = await findExistingSubmission();

  if (existing) {
    assertSameSubmission(existing, expected);

    return { repeated: true };
  }

  if (!evento.inscripciones_abiertas) {
    throw new RegistrationSubmissionError(
      "Las inscripciones están cerradas en este momento.",
      403,
    );
  }

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
      ...expected,
      evento_id: evento.id,
      solicitud_id: input.solicitud_id,
      estado: "pendiente",
      respuesta: "sin_respuesta",
    });

  if (!insertError) {
    return { repeated: false };
  }

  if (insertError.code === "23505") {
    const concurrentSubmission = await findExistingSubmission();

    if (concurrentSubmission) {
      assertSameSubmission(concurrentSubmission, expected);

      return { repeated: true };
    }
  }

  console.error("[submitRegistration:insert]", {
    code: insertError.code,
  });

  throw new RegistrationSubmissionError(
    "No fue posible guardar tu solicitud. Intenta nuevamente.",
    500,
  );
}