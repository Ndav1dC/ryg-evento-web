"use client";

import { useActionState } from "react";

import {
  revisarInscripcion,
  type ResultadoRevision,
} from "./actions";

type FormularioRevisionProps = {
  inscripcionId: string;
  nombre: string;
  estadoActual: "pendiente" | "lista_espera";
};

const estadoInicial: ResultadoRevision = {
  ok: false,
  mensaje: "",
};

export function FormularioRevision({
  inscripcionId,
  nombre,
  estadoActual,
}: FormularioRevisionProps) {
  const [resultado, formAction, pendiente] =
    useActionState(
      revisarInscripcion,
      estadoInicial,
    );

  return (
    <form
      action={formAction}
      onSubmit={(evento) => {
        const datos = new FormData(evento.currentTarget);
        const destino = datos.get("nuevoEstado");

        const etiquetas: Record<string, string> = {
          aprobado: "Aprobado",
          lista_espera: "Lista de espera",
          rechazado: "Rechazado",
        };

        const etiqueta = etiquetas[String(destino)];

        if (
          !etiqueta ||
          !window.confirm(
            `¿Cambiar la solicitud de ${nombre} a "${etiqueta}"?`,
          )
        ) {
          evento.preventDefault();
        }
      }}
      className="mt-5 border-t border-[#EEE7D6] pt-5"
    >
      <input
        type="hidden"
        name="inscripcionId"
        value={inscripcionId}
      />

      <input
        type="hidden"
        name="estadoAnterior"
        value={estadoActual}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor={`accion-${inscripcionId}`}
            className="block text-sm font-medium text-neutral-800"
          >
            Acción administrativa
          </label>

          <select
            id={`accion-${inscripcionId}`}
            name="nuevoEstado"
            defaultValue=""
            required
            disabled={pendiente}
            className="mt-2 w-full rounded-xl border border-[#D8D1BF] bg-white px-3 py-2.5 text-sm text-neutral-950 outline-none focus:border-[#A87912] focus:ring-2 focus:ring-[#D9B65D]/25 disabled:opacity-60"
          >
            <option value="" disabled>
              Selecciona una acción
            </option>

            <option value="aprobado">
              Aprobar inscripción
            </option>

            {estadoActual !== "lista_espera" ? (
              <option value="lista_espera">
                Enviar a lista de espera
              </option>
            ) : null}

            <option value="rechazado">
              Rechazar solicitud
            </option>
          </select>
        </div>

        <button
          type="submit"
          disabled={pendiente}
          className="rounded-xl bg-gradient-to-r from-[#A87912] via-[#E4C366] to-[#B88A20] px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#856013] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendiente ? "Guardando..." : "Guardar cambio"}
        </button>
      </div>

      {resultado.mensaje ? (
        <p
          role="status"
          className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
            resultado.ok
              ? "border-[#E4D3A1] bg-[#FBF6E8] text-[#765410]"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {resultado.mensaje}
        </p>
      ) : null}
    </form>
  );
}