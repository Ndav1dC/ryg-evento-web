"use server";

import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { obtenerSesionPanel } from "@/lib/auth/panel";
import { getConfiguredEventId } from "@/lib/env/server";
import {
  cifrarTokenInvitacion,
  descifrarTokenInvitacion,
} from "@/lib/invitations/encryption";
import {
  crearTokenInvitacion,
  obtenerHashInvitacion,
} from "@/lib/invitations/token";
import { createAdminClient } from "@/lib/supabase/admin";

export type ResultadoInvitacion = {
  ok: boolean;
  mensaje: string;
  imagen?: string;
  hashActual?: string;
};

const esquemaSolicitud = z.object({
  accion: z.enum(["recuperar", "emitir"]),
  inscripcionId: z.uuid(),
  hashAnterior: z.union([
    z.literal(""),
    z.string().regex(/^[0-9a-f]{64}$/),
  ]),
});

const esquemaGuardado = z.object({
  ok: z.boolean(),
  mensaje: z.string(),
});

async function generarImagen(
  token: string,
): Promise<string> {
  return QRCode.toDataURL(token, {
    type: "image/png",
    width: 600,
    margin: 4,
    errorCorrectionLevel: "M",
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

export async function emitirInvitacion(
  _estado: ResultadoInvitacion,
  formData: FormData,
): Promise<ResultadoInvitacion> {
  try {
    const sesion = await obtenerSesionPanel();

    if (!sesion || sesion.rol !== "admin") {
      return {
        ok: false,
        mensaje:
          "No tienes autorización para gestionar invitaciones.",
      };
    }

    const resultado = esquemaSolicitud.safeParse({
      accion: formData.get("accion"),
      inscripcionId: formData.get("inscripcionId"),
      hashAnterior: formData.get("hashAnterior"),
    });

    if (!resultado.success) {
      return {
        ok: false,
        mensaje:
          "Los datos de la solicitud no son válidos.",
      };
    }

    const {
      accion,
      inscripcionId,
      hashAnterior,
    } = resultado.data;

    const supabase = createAdminClient();
    const eventoId = getConfiguredEventId();

    const {
      data: inscripcion,
      error: registrationError,
    } = await supabase
      .from("inscripciones")
      .select("id, estado")
      .eq("id", inscripcionId)
      .eq("evento_id", eventoId)
      .maybeSingle();

    if (registrationError) {
      console.error("[invitaciones:inscripcion]", {
        code: registrationError.code,
      });

      return {
        ok: false,
        mensaje:
          "No fue posible comprobar la inscripción.",
      };
    }

    if (
      !inscripcion ||
      inscripcion.estado !== "aprobado"
    ) {
      return {
        ok: false,
        mensaje:
          "La inscripción no existe en este evento o no está aprobada.",
      };
    }

    const {
      data: ingreso,
      error: checkinError,
    } = await supabase
      .from("checkins")
      .select("id")
      .eq("inscripcion_id", inscripcionId)
      .maybeSingle();

    if (checkinError) {
      console.error("[invitaciones:checkin]", {
        code: checkinError.code,
      });

      return {
        ok: false,
        mensaje:
          "No fue posible comprobar el ingreso.",
      };
    }

    if (ingreso) {
      return {
        ok: false,
        mensaje:
          "Esta inscripción ya tiene una entrega de manilla registrada. No se recuperó ni emitió otra invitación.",
      };
    }

    const contexto = {
      eventoId,
      inscripcionId,
    };

    if (accion === "recuperar") {
      const {
        data: invitacion,
        error: invitationError,
      } = await supabase
        .from("invitaciones_qr")
        .select(
          "token_hash, token_cifrado, revocada_at",
        )
        .eq("inscripcion_id", inscripcionId)
        .maybeSingle();

      if (invitationError) {
        console.error("[invitaciones:recuperar]", {
          code: invitationError.code,
        });

        return {
          ok: false,
          mensaje:
            "No fue posible consultar la invitación.",
        };
      }

      if (!invitacion) {
        return {
          ok: false,
          mensaje:
            "Todavía no existe una invitación para esta inscripción.",
        };
      }

      if (invitacion.revocada_at) {
        return {
          ok: false,
          mensaje:
            "La invitación está revocada. Recuperarla no la reactiva.",
        };
      }

      if (!invitacion.token_cifrado) {
        return {
          ok: false,
          mensaje:
            "Esta invitación antigua no tiene una copia recuperable. Su QR anterior no cambió. Si necesitas una copia recuperable, reemite expresamente un código nuevo.",
        };
      }

      let token: string;

      try {
        token = descifrarTokenInvitacion(
          invitacion.token_cifrado,
          contexto,
        );
      } catch {
        return {
          ok: false,
          mensaje:
            "No fue posible descifrar la invitación. Comprueba la clave de cifrado del servidor. No se modificó el QR existente.",
        };
      }

      if (
        obtenerHashInvitacion(token) !==
        invitacion.token_hash
      ) {
        return {
          ok: false,
          mensaje:
            "El código recuperado no coincide con la invitación guardada. No se modificó ningún dato.",
        };
      }

      const imagen = await generarImagen(token);

      return {
        ok: true,
        mensaje:
          "Recuperaste la misma invitación. Su código no fue reemplazado.",
        imagen,
        hashActual: invitacion.token_hash,
      };
    }

    const token = crearTokenInvitacion();
    const tokenHash = obtenerHashInvitacion(token);

    let tokenCifrado: string;

    try {
      tokenCifrado = cifrarTokenInvitacion(
        token,
        contexto,
      );

      const comprobacion = descifrarTokenInvitacion(
        tokenCifrado,
        contexto,
      );

      if (comprobacion !== token) {
        throw new Error(
          "Falló la comprobación del cifrado.",
        );
      }
    } catch {
      return {
        ok: false,
        mensaje:
          "No fue posible preparar el almacenamiento cifrado. Comprueba INVITATIONS_ENCRYPTION_KEY. No se modificó la invitación.",
      };
    }

    const imagen = await generarImagen(token);

    const { data, error } = await supabase.rpc(
      "guardar_invitacion_cifrada",
      {
        p_evento_id: eventoId,
        p_usuario_id: sesion.usuarioId,
        p_inscripcion_id: inscripcionId,
        p_hash_anterior: hashAnterior,
        p_token_hash: tokenHash,
        p_token_cifrado: tokenCifrado,
      },
    );

    if (error) {
      console.error("[invitaciones:guardar]", {
        code: error.code,
      });

      return {
        ok: false,
        mensaje:
          "No pudimos confirmar el guardado. Actualiza la página e intenta recuperar la invitación antes de emitir otra.",
      };
    }

    const guardado =
      esquemaGuardado.safeParse(data);

    if (!guardado.success) {
      return {
        ok: false,
        mensaje:
          "No pudimos interpretar el resultado. Actualiza la página y consulta la invitación antes de reemitir.",
      };
    }

    if (!guardado.data.ok) {
      return {
        ok: false,
        mensaje: guardado.data.mensaje,
      };
    }

    revalidatePath("/admin/invitaciones");

    return {
      ok: true,
      mensaje:
        "Invitación generada y guardada de forma cifrada. Podrás recuperarla después sin cambiar el código.",
      imagen,
      hashActual: tokenHash,
    };
  } catch {
    console.error(
      "[invitaciones] Error inesperado.",
    );

    return {
      ok: false,
      mensaje:
        "No fue posible completar la operación. Actualiza y comprueba la invitación antes de volver a emitir.",
    };
  }
}