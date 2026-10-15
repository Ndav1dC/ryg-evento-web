import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

import {
  esTokenInvitacionValido,
} from "@/lib/invitations/token";

type ContextoInvitacion = {
  eventoId: string;
  inscripcionId: string;
};

function obtenerClave(): Buffer {
  const valor =
    process.env.INVITATIONS_ENCRYPTION_KEY?.trim();

  if (!valor || !/^[0-9a-fA-F]{64}$/.test(valor)) {
    throw new Error(
      "INVITATIONS_ENCRYPTION_KEY debe contener exactamente 64 caracteres hexadecimales.",
    );
  }

  return Buffer.from(valor, "hex");
}

function obtenerContexto(
  contexto: ContextoInvitacion,
): Buffer {
  return Buffer.from(
    `ryg:invitacion:v1:${contexto.eventoId}:${contexto.inscripcionId}`,
    "utf8",
  );
}

export function cifrarTokenInvitacion(
  token: string,
  contexto: ContextoInvitacion,
): string {
  if (!esTokenInvitacionValido(token)) {
    throw new Error(
      "El código de invitación tiene un formato inválido.",
    );
  }

  const clave = obtenerClave();
  const iv = randomBytes(12);

  const cifrador = createCipheriv(
    "aes-256-gcm",
    clave,
    iv,
    {
      authTagLength: 16,
    },
  );

  cifrador.setAAD(obtenerContexto(contexto));

  const contenido = Buffer.concat([
    cifrador.update(token, "utf8"),
    cifrador.final(),
  ]);

  const etiqueta = cifrador.getAuthTag();

  return [
    "v1",
    iv.toString("hex"),
    etiqueta.toString("hex"),
    contenido.toString("hex"),
  ].join(".");
}

export function descifrarTokenInvitacion(
  valor: string,
  contexto: ContextoInvitacion,
): string {
  if (
    typeof valor !== "string" ||
    valor.length > 512
  ) {
    throw new Error(
      "El contenido cifrado tiene un formato inválido.",
    );
  }

  const partes = valor.split(".");

  if (partes.length !== 4) {
    throw new Error(
      "El contenido cifrado tiene un formato inválido.",
    );
  }

  const [version, ivHex, etiquetaHex, contenidoHex] =
    partes;

  if (
    version !== "v1" ||
    !/^[0-9a-f]{24}$/.test(ivHex) ||
    !/^[0-9a-f]{32}$/.test(etiquetaHex) ||
    !/^(?:[0-9a-f]{2})+$/.test(contenidoHex)
  ) {
    throw new Error(
      "El contenido cifrado tiene un formato inválido.",
    );
  }

  const descifrador = createDecipheriv(
    "aes-256-gcm",
    obtenerClave(),
    Buffer.from(ivHex, "hex"),
    {
      authTagLength: 16,
    },
  );

  descifrador.setAAD(obtenerContexto(contexto));

  descifrador.setAuthTag(
    Buffer.from(etiquetaHex, "hex"),
  );

  const contenido = Buffer.concat([
    descifrador.update(
      Buffer.from(contenidoHex, "hex"),
    ),
    descifrador.final(),
  ]);

  const token = contenido.toString("utf8");

  if (!esTokenInvitacionValido(token)) {
    throw new Error(
      "El código recuperado tiene un formato inválido.",
    );
  }

  return token;
}