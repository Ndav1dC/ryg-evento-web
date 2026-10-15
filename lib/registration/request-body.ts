import "server-only";

const MAX_BODY_BYTES = 8 * 1024;

export class RegistrationBodyError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "RegistrationBodyError";
  }
}

export async function readRegistrationBody(
  request: Request,
): Promise<unknown> {
  const contentLength = request.headers.get("content-length");

  if (contentLength !== null) {
    const declaredLength = Number(contentLength);

    if (
      Number.isFinite(declaredLength) &&
      declaredLength > MAX_BODY_BYTES
    ) {
      throw new RegistrationBodyError(
        "La solicitud supera el tamaño permitido.",
        413,
      );
    }
  }

  if (!request.body) {
    throw new RegistrationBodyError(
      "La solicitud no contiene datos.",
      400,
    );
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", {
    fatal: true,
  });

  let totalBytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > MAX_BODY_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // El límite ya se superó; conservamos el error 413.
        }

        throw new RegistrationBodyError(
          "La solicitud supera el tamaño permitido.",
          413,
        );
      }

      text += decoder.decode(value, {
        stream: true,
      });
    }

    text += decoder.decode();

    if (!text.trim()) {
      throw new RegistrationBodyError(
        "La solicitud no contiene datos.",
        400,
      );
    }

    return JSON.parse(text) as unknown;
  } catch (error: unknown) {
    if (error instanceof RegistrationBodyError) {
      throw error;
    }

    throw new RegistrationBodyError(
      "La solicitud no contiene un JSON UTF-8 válido.",
      400,
    );
  } finally {
    reader.releaseLock();
  }
}