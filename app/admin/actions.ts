"use server";

import { redirect } from "next/navigation";

import { createSupabaseAuthClient } from "@/lib/supabase/auth";

export async function cerrarSesion() {
  const supabase = await createSupabaseAuthClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(
      "No fue posible cerrar la sesión. Intenta nuevamente.",
    );
  }

  redirect("/login");
}