"use server";

import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { obtenerSesionPanel } from "@/lib/auth/panel";
import { getConfiguredEventId } from "@/lib/env/server";
import {
  crearTokenInvitacion,
  obtenerHashInvitacion,
} from "@/lib/invitations/token";
import { createAdminClient } from "@/lib/supabase/admin";

export type ResultadoInvitacion = {
  ok: boolean;
  mensaje: string;
  imagen?: string;
};

const esquemaEmision = z.object({
  inscripcionId: z.uuid(),
  hashAnterior: z.union([
    z.literal(""),
    z.string().regex(/^[0-9a-f]{64}$/),
  ]),
});

export async function emitirInvitacion(
  _estado: ResultadoInvitacion,
  formData: FormData,
): Promise<ResultadoInvitacion> {
  const sesion = await obtenerSesionPanel();

  if (!sesion || sesion.rol !== "admin") {
    return {
      ok: false,
      mensaje:
        "No tienes autorización para emitir invitaciones.",
    };
  }

  const resultado = esquemaEmision.safeParse({
    inscripcionId: formData.get("inscripcionId"),
    hashAnterior: formData.get("hashAnterior"),
  });

  if (!resultado.success) {
    return {
      ok: false,
      mensaje: "Los datos de la solicitud no son válidos.",
    };
  }

  const { inscripcionId, hashAnterior } = resultado.data;

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
    console.error("[emitirInvitacion:inscripcion]", {
      code: registrationError.code,
    });

    return {
      ok: false,
      mensaje: "No fue posible comprobar la inscripción.",
    };
  }

  if (!inscripcion || inscripcion.estado !== "aprobado") {
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
    console.error("[emitirInvitacion:checkin]", {
      code: checkinError.code,
    });

    return {
      ok: false,
      mensaje: "No fue posible comprobar el ingreso.",
    };
  }

  if (ingreso) {
    return {
      ok: false,
      mensaje:
        "Esta inscripción ya tiene un ingreso registrado. No se emitió otro código.",
    };
  }

  const token = crearTokenInvitacion();
  const tokenHash = obtenerHashInvitacion(token);

  let imagen: string;

  try {
    imagen = await QRCode.toDataURL(token, {
      type: "image/png",
      width: 600,
      margin: 4,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  } catch {
    return {
      ok: false,
      mensaje:
        "No fue posible generar la imagen. No se modificó la invitación.",
    };
  }

  if (hashAnterior) {
    const { data, error } = await supabase
      .from("invitaciones_qr")
      .update({
        token_hash: tokenHash,
        revocada_at: null,
      })
      .eq("inscripcion_id", inscripcionId)
      .eq("token_hash", hashAnterior)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[emitirInvitacion:sustituir]", {
        code: error.code,
      });

      return {
        ok: false,
        mensaje: "No fue posible sustituir la invitación.",
      };
    }

    if (!data) {
      return {
        ok: false,
        mensaje:
          "La invitación cambió desde que abriste la página. Actualiza antes de volver a emitir.",
      };
    }
  } else {
    const { error } = await supabase
      .from("invitaciones_qr")
      .insert({
        inscripcion_id: inscripcionId,
        token_hash: tokenHash,
      });

    if (error) {
      console.error("[emitirInvitacion:crear]", {
        code: error.code,
      });

      return {
        ok: false,
        mensaje:
          error.code === "23505"
            ? "Ya existe una invitación. Actualiza la página antes de continuar."
            : "No fue posible guardar la invitación.",
      };
    }
  }

  revalidatePath("/admin/invitaciones");

  return {
    ok: true,
    mensaje:
      "Invitación generada. Descarga el QR antes de salir de esta página.",
    imagen,
  };
}