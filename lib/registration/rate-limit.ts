import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

const rateLimitResponseSchema = z.object({
  allowed: z.boolean(),
  retry_after: z.number().int().nonnegative(),
});

export class RegistrationRateLimitError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "RegistrationRateLimitError";
  }
}

function getClientIdentifier(request: Request): string {
  if (process.env.VERCEL === "1") {
    const ip = request.headers
      .get("x-vercel-forwarded-for")
      ?.trim();

    if (!ip || !isIP(ip)) {
      throw new RegistrationRateLimitError(
        "No fue posible comprobar el origen de la solicitud.",
        503,
      );
    }

    return ip.toLowerCase();
  }

  if (process.env.NODE_ENV === "development") {
    return "local-development";
  }

  throw new RegistrationRateLimitError(
    "La protección de solicitudes no está configurada para este servidor.",
    503,
  );
}

export async function enforceRegistrationRateLimit(
  request: Request,
): Promise<void> {
  const secret = process.env.REGISTRATION_RATE_LIMIT_SECRET;

  if (!secret || secret.length < 32) {
    console.error(
      "[registration:rate-limit] Falta un secreto válido.",
    );

    throw new RegistrationRateLimitError(
      "El registro no está disponible temporalmente.",
      503,
    );
  }

  const identifier = getClientIdentifier(request);

  const keyHash = createHmac("sha256", secret)
    .update(`registration:v1:${identifier}`)
    .digest("hex");

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .rpc("consume_registration_rate_limit", {
      p_key_hash: keyHash,
    })
    .single();

  if (error) {
    console.error("[registration:rate-limit:rpc]", {
      code: error.code,
    });

    throw new RegistrationRateLimitError(
      "No fue posible comprobar el límite de solicitudes.",
      503,
    );
  }

  const result = rateLimitResponseSchema.safeParse(data);

  if (!result.success) {
    console.error(
      "[registration:rate-limit] Respuesta RPC inválida.",
    );

    throw new RegistrationRateLimitError(
      "No fue posible comprobar el límite de solicitudes.",
      503,
    );
  }

  const rateLimit = result.data;

  if (!rateLimit.allowed) {
    throw new RegistrationRateLimitError(
      "Se alcanzó el límite de intentos. Espera antes de volver a enviar.",
      429,
      Math.max(1, rateLimit.retry_after),
    );
  }
}