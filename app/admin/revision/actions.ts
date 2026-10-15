"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { obtenerSesionPanel } from "@/lib/auth/panel";
import { getConfiguredEventId } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ResultadoRevision = {
  ok: boolean;
  mensaje: string;
};

const esquemaRevision = z.object({
  inscripcionId: z.uuid(),
  estadoAnterior: z.enum([
    "pendiente",
    "lista_espera",
  ]),
  nuevoEstado: z.enum([
    "aprobado",
    "lista_espera",
    "rechazado",
  ]),
});

export async function revisarInscripcion(
  _estado: ResultadoRevision,
  formData: FormData,
): Promise<ResultadoRevision> {
  const sesion = await obtenerSesionPanel();

  if (!sesion || sesion.rol !== "admin") {
    return {
      ok: false,
      mensaje:
        "No tienes autorización. Inicia sesión con una cuenta administradora.",
    };
  }

  const resultado = esquemaRevision.safeParse({
    inscripcionId: formData.get("inscripcionId"),
    estadoAnterior: formData.get("estadoAnterior"),
    nuevoEstado: formData.get("nuevoEstado"),
  });

  if (!resultado.success) {
    return {
      ok: false,
      mensaje: "Los datos de la solicitud no son válidos.",
    };
  }

  const {
    inscripcionId,
    estadoAnterior,
    nuevoEstado,
  } = resultado.data;

  if (estadoAnterior === nuevoEstado) {
    return {
      ok: false,
      mensaje:
        "La inscripción ya está en ese estado. Elige otra acción.",
    };
  }

  const supabase = createAdminClient();
  const eventoId = getConfiguredEventId();

  const { data, error } = await supabase
    .from("inscripciones")
    .update({
      estado: nuevoEstado,
    })
    .eq("id", inscripcionId)
    .eq("evento_id", eventoId)
    .eq("estado", estadoAnterior)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "Error al revisar inscripción:",
      error.code,
      error.message,
    );

    if (
      error.message.includes(
        "No hay cupos disponibles",
      )
    ) {
      return {
        ok: false,
        mensaje:
          "No hay cupos disponibles o no se ha configurado la capacidad. Puedes dejar la solicitud en lista de espera.",
      };
    }

    return {
      ok: false,
      mensaje:
        "No fue posible guardar el cambio. Revisa la terminal del servidor.",
    };
  }

  if (!data) {
    return {
      ok: false,
      mensaje:
        "La solicitud cambió de estado o ya no está disponible. Actualiza la página antes de continuar.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/revision");

  return {
    ok: true,
    mensaje: "Cambio guardado correctamente.",
  };
}