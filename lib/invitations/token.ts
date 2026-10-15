import "server-only";

import {
  createHash,
  randomBytes,
} from "node:crypto";

const PREFIJO = "RYG1";
const PATRON_TOKEN = /^RYG1\.[0-9a-f]{64}$/;

export function crearTokenInvitacion(): string {
  const codigo = randomBytes(32).toString("hex");

  return `${PREFIJO}.${codigo}`;
}

export function esTokenInvitacionValido(
  valor: unknown,
): valor is string {
  return (
    typeof valor === "string" &&
    PATRON_TOKEN.test(valor)
  );
}

export function obtenerHashInvitacion(
  token: string,
): string {
  if (!esTokenInvitacionValido(token)) {
    throw new Error(
      "El código de invitación tiene un formato inválido.",
    );
  }

  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}