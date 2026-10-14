import "server-only";

import { getConfiguredEventId } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type RegistrationEvent = {
  id: string;
  nombre: string;
  inscripciones_abiertas: boolean;
};

export async function getRegistrationEvent(): Promise<RegistrationEvent> {
  const supabase = createAdminClient();
  const eventoId = getConfiguredEventId();

  const { data, error } = await supabase
    .from("eventos")
    .select("id, nombre, inscripciones_abiertas")
    .eq("id", eventoId)
    .single();

  if (error) {
    console.error("[getRegistrationEvent]", {
      code: error.code,
      message: error.message,
    });

    throw new Error(
      "No fue posible consultar el evento configurado.",
    );
  }

  return {
    id: data.id,
    nombre: data.nombre,
    inscripciones_abiertas: data.inscripciones_abiertas,
  };
}