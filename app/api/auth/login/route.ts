import { NextResponse } from "next/server";

import { createSupabaseAuthClient } from "@/lib/supabase/auth";
import { obtenerSesionPanel } from "@/lib/auth/panel";

export async function POST(request: Request) {
  let cuerpo: unknown;

  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Solicitud inválida.",
      },
      { status: 400 },
    );
  }

  const datos = cuerpo as {
    correo?: unknown;
    contrasena?: unknown;
  };

  const correo =
    typeof datos.correo === "string"
      ? datos.correo.trim().toLowerCase()
      : "";

  const contrasena =
    typeof datos.contrasena === "string"
      ? datos.contrasena
      : "";

  if (!correo || !contrasena) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Debes ingresar correo y contraseña.",
      },
      { status: 400 },
    );
  }

  const supabase =
    await createSupabaseAuthClient();

  const { error } =
    await supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Correo o contraseña incorrectos.",
      },
      { status: 401 },
    );
  }

  const sesion = await obtenerSesionPanel();

  if (!sesion) {
    await supabase.auth.signOut();

    return NextResponse.json(
      {
        ok: false,
        error:
          "Esta cuenta no tiene acceso al panel de este evento.",
      },
      { status: 403 },
    );
  }

  return NextResponse.json({
    ok: true,
    rol: sesion.rol,
  });
}