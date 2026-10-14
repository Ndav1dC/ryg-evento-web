import { NextResponse } from "next/server";

import {
  RegistrationSubmissionError,
  submitRegistration,
} from "@/lib/registration/submission";
import { registrationSubmissionSchema } from "@/lib/registration/submission-schema";

export const runtime = "nodejs";

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const contentType = request.headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();

  if (contentType !== "application/json") {
    return jsonResponse(
      {
        ok: false,
        error: "Envía la solicitud en formato JSON.",
      },
      415,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        ok: false,
        error: "La solicitud no contiene un JSON válido.",
      },
      400,
    );
  }

  const result = registrationSubmissionSchema.safeParse(body);

  if (!result.success) {
    return jsonResponse(
      {
        ok: false,
        error:
          result.error.issues[0]?.message ??
          "Revisa los datos de la solicitud.",
      },
      400,
    );
  }

  try {
    await submitRegistration(result.data);

    return jsonResponse(
      {
        ok: true,
        message:
          "Recibimos tu solicitud. Está pendiente de revisión.",
      },
      201,
    );
  } catch (error: unknown) {
    if (error instanceof RegistrationSubmissionError) {
      return jsonResponse(
        {
          ok: false,
          error: error.message,
        },
        error.status,
      );
    }

    console.error("[POST /api/inscripciones] Error inesperado.");

    return jsonResponse(
      {
        ok: false,
        error:
          "Ocurrió un error al procesar tu solicitud. Intenta nuevamente.",
      },
      500,
    );
  }
}