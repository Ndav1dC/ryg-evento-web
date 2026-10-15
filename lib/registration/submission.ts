import "server-only";

import { z } from "zod";

import { getRegistrationTypeByCode } from "@/lib/registration/access";
import { getRegistrationEvent } from "@/lib/registration/event";
import {
  leaderOrganizationSchema,
  staffEquipmentSchema,
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

const comparableRegistrationSchema = z.object({
  tipo: z.enum(["asistente", "lider", "staff"]),
  nombre_completo: z.string(),
  whatsapp: z.string(),
  municipio_codigo: z.string().nullable(),
  organizacion: z.string().nullable(),
  area_apoyo: z.string().nullable(),
  equipos: z.string().nullable(),
  disponibilidad_completa: z.boolean(),
});

type ComparableRegistration = z.infer<
  typeof comparableRegistrationSchema
>;

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
    existing.area_apoyo === expected.area_apoyo &&
    existing.equipos === expected.equipos &&
    existing.disponibilidad_completa ===
      expected.disponibilidad_completa;

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

  let municipioCodigo: string | null = null;
  let organizacion: string | null = null;
  let areaApoyo: string | null = null;
  let equipos: string | null = null;
  let disponibilidadCompleta = false;

  if (tipo === "staff") {
    const equipmentResult = staffEquipmentSchema.safeParse(
      input.equipos,
    );

    if (!equipmentResult.success) {
      throw new RegistrationSubmissionError(
        equipmentResult.error.issues[0]?.message ??
          "Revisa los equipos disponibles.",
        400,
      );
    }

    areaApoyo = "MEDIOS";
    equipos = equipmentResult.data;
    disponibilidadCompleta = input.disponibilidad_completa;
  } else {
    if (!/^\d{5}$/.test(input.municipio)) {
      throw new RegistrationSubmissionError(
        "Selecciona un municipio válido.",
        400,
      );
    }

    municipioCodigo = input.municipio;

    if (tipo === "lider") {
      const organizationResult =
        leaderOrganizationSchema.safeParse(
          input.organizacion,
        );

      if (!organizationResult.success) {
        throw new RegistrationSubmissionError(
          organizationResult.error.issues[0]?.message ??
            "Revisa el nombre de tu iglesia u organización.",
          400,
        );
      }

      organizacion = organizationResult.data;
    }
  }

  const evento = await getRegistrationEvent();
  const supabase = createAdminClient();

  const expected: ComparableRegistration = {
    tipo,
    nombre_completo: input.nombre,
    whatsapp: input.whatsapp,
    municipio_codigo: municipioCodigo,
    organizacion,
    area_apoyo: areaApoyo,
    equipos,
    disponibilidad_completa: disponibilidadCompleta,
  };

  async function findExistingSubmission():
    Promise<ComparableRegistration | null> {
    const { data, error } = await supabase
      .from("inscripciones")
      .select(
        "tipo, nombre_completo, whatsapp, municipio_codigo, " +
          "organizacion, area_apoyo, equipos, " +
          "disponibilidad_completa",
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

    if (data === null) {
      return null;
    }

    const result = comparableRegistrationSchema.safeParse(data);

    if (!result.success) {
      console.error(
        "[submitRegistration] Datos guardados con formato inesperado.",
      );

      throw new RegistrationSubmissionError(
        "No fue posible comprobar tu solicitud. Intenta nuevamente.",
        500,
      );
    }

    return result.data;
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
    data: capacidad,
    error: capacityError,
  } = await supabase
    .from("eventos")
    .select("capacidad_maxima")
    .eq("id", evento.id)
    .single();

  if (capacityError || !capacidad) {
    console.error("[submitRegistration:capacidad]", {
      code: capacityError?.code,
    });

    throw new RegistrationSubmissionError(
      "No fue posible comprobar la disponibilidad. Intenta nuevamente.",
      503,
    );
  }

  if (capacidad.capacidad_maxima === null) {
    throw new RegistrationSubmissionError(
      "El registro no está disponible temporalmente.",
      503,
    );
  }

  if (municipioCodigo !== null) {
    const {
      data: municipio,
      error: municipalityError,
    } = await supabase
      .from("municipios")
      .select("codigo")
      .eq("codigo", municipioCodigo)
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
  }

  const { error: insertError } = await supabase
    .from("inscripciones")
    .insert({
      ...expected,
      evento_id: evento.id,
      solicitud_id: input.solicitud_id,
      estado: "aprobado",
      respuesta: "sin_respuesta",
    });

  if (!insertError) {
    return { repeated: false };
  }

  if (insertError.code === "23505") {
    const concurrentSubmission =
      await findExistingSubmission();

    if (concurrentSubmission) {
      assertSameSubmission(concurrentSubmission, expected);

      return { repeated: true };
    }
  }

  if (
    insertError.message.includes(
      "No hay cupos disponibles",
    )
  ) {
    const concurrentSubmission =
      await findExistingSubmission();

    if (concurrentSubmission) {
      assertSameSubmission(concurrentSubmission, expected);

      return { repeated: true };
    }

    throw new RegistrationSubmissionError(
      "Se han agotado los cupos disponibles para este evento.",
      422,
    );
  }

  console.error("[submitRegistration:insert]", {
    code: insertError.code,
  });

  throw new RegistrationSubmissionError(
    "No fue posible guardar tu solicitud. Intenta nuevamente.",
    500,
  );
}