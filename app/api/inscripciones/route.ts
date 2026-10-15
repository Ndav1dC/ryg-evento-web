import { NextResponse } from "next/server";

import {
  enforceRegistrationRateLimit,
  RegistrationRateLimitError,
} from "@/lib/registration/rate-limit";
import {
  RegistrationBodyError,
  readRegistrationBody,
} from "@/lib/registration/request-body";
import {
  RegistrationSubmissionError,
  submitRegistration,
} from "@/lib/registration/submission";
import { registrationSubmissionSchema } from "@/lib/registration/submission-schema";

export const runtime = "nodejs";

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  extraHeaders: Record<string, string> = {},
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

export async function POST(request: Request) {
  try {
    await enforceRegistrationRateLimit(request);
  } catch (error: unknown) {
    if (error instanceof RegistrationRateLimitError) {
      const headers: Record<string, string> = {};

      if (error.retryAfter !== undefined) {
        headers["Retry-After"] = String(error.retryAfter);
      }

      return jsonResponse(
        {
          ok: false,
          error: error.message,
        },
        error.status,
        headers,
      );
    }

    console.error(
      "[POST /api/inscripciones] Falló la protección de solicitudes.",
    );

    return jsonResponse(
      {
        ok: false,
        error: "El registro no está disponible temporalmente.",
      },
      503,
    );
  }

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
    body = await readRegistrationBody(request);
  } catch (error: unknown) {
    if (error instanceof RegistrationBodyError) {
      return jsonResponse(
        {
          ok: false,
          error: error.message,
        },
        error.status,
      );
    }

    return jsonResponse(
      {
        ok: false,
        error: "No fue posible leer la solicitud.",
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
    const submission = await submitRegistration(result.data);

    return jsonResponse(
      {
        ok: true,
        repeated: submission.repeated,
        message: submission.repeated
          ? "Tu solicitud ya había sido recibida."
          : "Recibimos tu solicitud. Está pendiente de revisión.",
      },
      submission.repeated ? 200 : 201,
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