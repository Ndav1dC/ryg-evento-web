import { NextResponse } from "next/server";

import { getRegistrationEvent } from "@/lib/registration/event";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const evento = await getRegistrationEvent();

    return NextResponse.json(
      {
        ok: true,
        evento: {
          nombre: evento.nombre,
          inscripcionesAbiertas: evento.inscripciones_abiertas,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message:
          "No se pudo consultar el evento. Revisa la terminal del servidor.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}