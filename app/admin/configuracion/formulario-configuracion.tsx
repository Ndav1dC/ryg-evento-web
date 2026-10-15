"use client";

import { useActionState } from "react";

import {
  guardarConfiguracion,
  type ResultadoConfiguracion,
} from "./actions";

type FormularioConfiguracionProps = {
  capacidad: number | null;
  abierto: boolean;
};

const estadoInicial: ResultadoConfiguracion = {
  ok: false,
  mensaje: "",
};

export function FormularioConfiguracion({
  capacidad,
  abierto,
}: FormularioConfiguracionProps) {
  const [resultado, formAction, pendiente] =
    useActionState(
      guardarConfiguracion,
      estadoInicial,
    );

  const claseCampo =
    "mt-2 w-full rounded-xl border border-[#D8D1BF] bg-white px-4 py-3 text-sm text-neutral-950 outline-none focus:border-[#A87912] focus:ring-2 focus:ring-[#D9B65D]/25 disabled:opacity-60";

  return (
    <form
      action={formAction}
      onSubmit={(evento) => {
        const datos = new FormData(
          evento.currentTarget,
        );

        const nuevaCapacidad = String(
          datos.get("capacidad"),
        );

        const abrir =
          datos.get("registro") === "abierto";

        const confirmado = window.confirm(
          `¿Guardar capacidad de ${nuevaCapacidad} personas y dejar las inscripciones ${
            abrir ? "ABIERTAS" : "CERRADAS"
          }?`,
        );

        if (!confirmado) {
          evento.preventDefault();
        }
      }}
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="capacidad"
          className="block text-sm font-medium text-neutral-800"
        >
          Capacidad máxima total
        </label>

        <input
          key={`capacidad-${capacidad}`}
          id="capacidad"
          name="capacidad"
          type="number"
          min={1}
          max={2147483647}
          step={1}
          required
          defaultValue={capacidad ?? ""}
          disabled={pendiente}
          className={claseCampo}
        />

        <p className="mt-2 text-xs leading-5 text-neutral-500">
          Incluye asistentes, líderes y staff.
          No puede ser menor que los cupos ocupados.
        </p>
      </div>

      <div>
        <label
          htmlFor="registro"
          className="block text-sm font-medium text-neutral-800"
        >
          Estado de las inscripciones
        </label>

        <select
          key={`registro-${abierto}`}
          id="registro"
          name="registro"
          defaultValue={abierto ? "abierto" : "cerrado"}
          disabled={pendiente}
          className={claseCampo}
        >
          <option value="cerrado">
            Cerradas
          </option>

          <option value="abierto">
            Abiertas
          </option>
        </select>

        <p className="mt-2 text-xs leading-5 text-neutral-500">
          Abrir el registro no amplía la capacidad ni
          modifica las inscripciones existentes.
        </p>
      </div>

      {resultado.mensaje ? (
        <p
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
            resultado.ok
              ? "border-[#E4D3A1] bg-[#FBF6E8] text-[#765410]"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {resultado.mensaje}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pendiente}
        className="w-full rounded-xl bg-gradient-to-r from-[#A87912] via-[#E4C366] to-[#B88A20] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#856013] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pendiente
          ? "Guardando..."
          : "Guardar configuración"}
      </button>
    </form>
  );
}