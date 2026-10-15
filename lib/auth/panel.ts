import "server-only";

import { redirect } from "next/navigation";

import {
  createSupabaseAuthClient,
} from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getConfiguredEventId } from "@/lib/env/server";

export type RolPanel = "admin" | "recepcion";

export type SesionPanel = {
  usuarioId: string;
  correo: string;
  rol: RolPanel;
};

export async function obtenerSesionPanel(): Promise<SesionPanel | null> {
  const supabaseAuth =
    await createSupabaseAuthClient();

  const { data: claimsData, error: claimsError } =
    await supabaseAuth.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    return null;
  }

  const usuarioId = claimsData.claims.sub;

  if (!usuarioId) {
    return null;
  }

  const supabaseAdmin =
    createAdminClient();
    
  const eventoId = getConfiguredEventId();

  const { data: usuarioEvento, error } =
    await supabaseAdmin
      .from("usuarios_evento")
      .select("usuario_id, rol")
      .eq("usuario_id", usuarioId)
      .eq("evento_id", eventoId)
      .eq("activo", true)
      .maybeSingle();

  if (error || !usuarioEvento) {
    return null;
  }

  if (
    usuarioEvento.rol !== "admin" &&
    usuarioEvento.rol !== "recepcion"
  ) {
    return null;
  }

  return {
    usuarioId,
    correo: String(
      claimsData.claims.email ?? "",
    ),
    rol: usuarioEvento.rol,
  };
}

export async function requerirSesionPanel(): Promise<SesionPanel> {
  const sesion = await obtenerSesionPanel();

  if (!sesion) {
    redirect("/login");
  }

  return sesion;
}