"use client";

import Image from "next/image";
import { useActionState } from "react";

import {
  emitirInvitacion,
  type ResultadoInvitacion,
} from "./actions";

type FormularioInvitacionProps = {
  inscripcionId: string;
  nombre: string;
  hashActual: string | null;
  revocada: boolean;
};

const estadoInicial: ResultadoInvitacion = {
  ok: false,
  mensaje: "",
};

export function FormularioInvitacion({
  inscripcionId,
  nombre,
  hashActual,
  revocada,
}: FormularioInvitacionProps) {
  const [resultado, formAction, pendiente] =
    useActionState(emitirInvitacion, estadoInicial);

  return (
    <div className="mt-5 border-t border-[#EEE7D6] pt-5">
      <form
        action={formAction}
        onSubmit={(evento) => {
          const mensaje = hashActual
            ? `¿Emitir un nuevo QR para ${nombre}? El código anterior dejará de ser válido.`
            : `¿Generar la invitación QR de ${nombre}?`;

          if (!window.confirm(mensaje)) {
            evento.preventDefault();
          }
        }}
      >
        <input
          type="hidden"
          name="inscripcionId"
          value={inscripcionId}
        />

        <input
          type="hidden"
          name="hashAnterior"
          value={hashActual ?? ""}
        />

        <p className="mb-3 text-xs leading-5 text-neutral-600">
          {hashActual
            ? revocada
              ? "Existe una invitación revocada. Emitir otra creará un código nuevo."
              : "Ya existe una invitación. Emitir otra invalidará el código anterior."
            : "Todavía no se ha emitido una invitación."}
        </p>

        <button
          type="submit"
          disabled={pendiente}
          className="rounded-xl bg-gradient-to-r from-[#A87912] via-[#E4C366] to-[#B88A20] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#856013] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendiente
            ? "Generando..."
            : hashActual
              ? "Emitir nuevo QR"
              : "Generar invitación QR"}
        </button>
      </form>

      {resultado.mensaje ? (
        <p
          role="status"
          className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-6 ${
            resultado.ok
              ? "border-[#E4D3A1] bg-[#FBF6E8] text-[#765410]"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {resultado.mensaje}
        </p>
      ) : null}

      {resultado.ok && resultado.imagen ? (
        <div className="mt-5 rounded-2xl border border-[#E4D3A1] bg-white p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#856013]">
            Reino y Gloria
          </p>

          <h3 className="mt-3 font-semibold">
            {nombre}
          </h3>

          <Image
            src={resultado.imagen}
            alt={`Código QR de ingreso de ${nombre}`}
            width={260}
            height={260}
            unoptimized
            className="mx-auto mt-4 h-auto w-full max-w-[260px]"
          />

          <a
            href={resultado.imagen}
            download={`qr-${inscripcionId}.png`}
            className="mt-4 inline-block rounded-xl border border-[#D8C38A] px-5 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-[#FBF6E8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#856013]"
          >
            Descargar QR
          </a>

          <p className="mt-3 text-xs leading-5 text-neutral-500">
            Guarda la imagen antes de salir.
            No compartas este código públicamente.
          </p>
        </div>
      ) : null}
    </div>
  );
}