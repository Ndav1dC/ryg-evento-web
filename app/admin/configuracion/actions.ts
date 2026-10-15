"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { obtenerSesionPanel } from "@/lib/auth/panel";
import { getConfiguredEventId } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ResultadoConfiguracion = {
  ok: boolean;
  mensaje: string;
};

const esquemaConfiguracion = z.object({
  capacidad: z.coerce
    .number()
    .int()
    .min(1)
    .max(2147483647),
  registro: z.enum(["abierto", "cerrado"]),
});

export async function guardarConfiguracion(
  _estado: ResultadoConfiguracion,
  formData: FormData,
): Promise<ResultadoConfiguracion> {
  const sesion = await obtenerSesionPanel();

  if (!sesion || sesion.rol !== "admin") {
    return {
      ok: false,
      mensaje:
        "No tienes autorización para modificar el evento.",
    };
  }

  const resultado = esquemaConfiguracion.safeParse({
    capacidad: formData.get("capacidad"),
    registro: formData.get("registro"),
  });

  if (!resultado.success) {
    return {
      ok: false,
      mensaje:
        "Ingresa una capacidad entera mayor que cero y selecciona el estado del registro.",
    };
  }

  const { capacidad, registro } = resultado.data;

  const supabase = createAdminClient();
  const eventoId = getConfiguredEventId();

  const { data, error } = await supabase
    .from("eventos")
    .update({
      capacidad_maxima: capacidad,
      inscripciones_abiertas: registro === "abierto",
    })
    .eq("id", eventoId)
    .lte("cupos_ocupados", capacidad)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "[guardarConfiguracion]",
      error.code,
      error.message,
    );

    return {
      ok: false,
      mensaje:
        "No fue posible guardar la configuración. Revisa la terminal del servidor.",
    };
  }

  if (!data) {
    return {
      ok: false,
      mensaje:
        "No se pudo actualizar el evento. La capacidad no puede ser menor que los cupos ocupados. Actualiza la página y revisa los valores.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/configuracion");
  revalidatePath("/inscripcion/[codigo]", "page");

  return {
    ok: true,
    mensaje:
      registro === "abierto"
        ? "Configuración guardada. El registro está abierto; las nuevas inscripciones dependen de los cupos disponibles."
        : "Configuración guardada. El registro está cerrado.",
  };
}