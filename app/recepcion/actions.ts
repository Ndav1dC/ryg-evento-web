"use server";

import { z } from "zod";

import { obtenerSesionPanel } from "@/lib/auth/panel";
import { getConfiguredEventId } from "@/lib/env/server";
import {
  esTokenInvitacionValido,
  obtenerHashInvitacion,
} from "@/lib/invitations/token";
import { createAdminClient } from "@/lib/supabase/admin";

const esquemaResultado = z.object({
  estado: z.enum([
    "error",
    "valido",
    "registrado",
    "ya_registrado",
  ]),
  mensaje: z.string(),
  nombre: z.string().optional(),
  tipo: z.enum([
    "asistente",
    "lider",
    "staff",
  ]).optional(),
  fecha: z.string().nullable().optional(),
});

export type ResultadoRecepcion = z.infer<
  typeof esquemaResultado
>;

export async function procesarCodigoRecepcion(
  codigo: string,
  confirmar: boolean,
): Promise<ResultadoRecepcion> {
  try {
    const sesion = await obtenerSesionPanel();

    if (
      !sesion ||
      !["admin", "recepcion"].includes(sesion.rol)
    ) {
      return {
        estado: "error",
        mensaje:
          "Tu sesión no está disponible o no tienes autorización. Inicia sesión nuevamente.",
      };
    }

    if (
      typeof codigo !== "string" ||
      typeof confirmar !== "boolean"
    ) {
      return {
        estado: "error",
        mensaje: "Solicitud inválida.",
      };
    }

    const token = codigo.trim();

    if (!esTokenInvitacionValido(token)) {
      return {
        estado: "error",
        mensaje:
          "Pega el contenido completo del QR. Debe comenzar con RYG1.",
      };
    }

    let fechaPrueba: string | null = null;

    if (
      process.env.NODE_ENV === "development" &&
      sesion.rol === "admin"
    ) {
      const configurada =
        process.env.RECEPCION_FECHA_PRUEBA?.trim();

      if (configurada) {
        const resultadoFecha = z.iso
          .date()
          .safeParse(configurada);

        if (!resultadoFecha.success) {
          return {
            estado: "error",
            mensaje:
              "RECEPCION_FECHA_PRUEBA debe tener formato AAAA-MM-DD y ser una fecha válida.",
          };
        }

        fechaPrueba = resultadoFecha.data;
      }
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc(
      "procesar_recepcion_qr",
      {
        p_evento_id: getConfiguredEventId(),
        p_usuario_id: sesion.usuarioId,
        p_token_hash: obtenerHashInvitacion(token),
        p_confirmar: confirmar,
        p_fecha_prueba: fechaPrueba,
      },
    );

    if (error) {
      console.error("[recepcion:rpc]", {
        code: error.code,
      });

      return {
        estado: "error",
        mensaje:
          "No pudimos confirmar el resultado. Consulta de nuevo el mismo QR antes de entregar una manilla.",
      };
    }

    const resultado =
      esquemaResultado.safeParse(data);

    if (!resultado.success) {
      console.error(
        "[recepcion] Respuesta con formato inesperado.",
      );

      return {
        estado: "error",
        mensaje:
          "No pudimos interpretar el resultado. Consulta nuevamente antes de entregar una manilla.",
      };
    }

    return resultado.data;
  } catch {
    console.error(
      "[recepcion] Error inesperado al procesar el código.",
    );

    return {
      estado: "error",
      mensaje:
        "No pudimos confirmar el resultado. Consulta otra vez el mismo QR; no entregues otra manilla sin comprobarlo.",
    };
  }
}