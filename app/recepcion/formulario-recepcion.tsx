"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import {
  procesarCodigoRecepcion,
  type ResultadoRecepcion,
} from "./actions";

export function FormularioRecepcion() {
  const [codigo, setCodigo] = useState("");
  const [codigoValidado, setCodigoValidado] =
    useState("");
  const [resultado, setResultado] =
    useState<ResultadoRecepcion | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function consultar(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    if (ocupado) {
      return;
    }

    const token = codigo.trim();

    setOcupado(true);
    setResultado(null);
    setCodigoValidado("");

    try {
      const respuesta =
        await procesarCodigoRecepcion(token, false);

      setResultado(respuesta);

      if (respuesta.estado === "valido") {
        setCodigoValidado(token);
      }
    } catch {
      setResultado({
        estado: "error",
        mensaje:
          "No fue posible consultar el código. Revisa la conexión e intenta nuevamente.",
      });
    } finally {
      setOcupado(false);
    }
  }

  async function confirmarEntrega() {
    if (
      ocupado ||
      !codigoValidado ||
      resultado?.estado !== "valido"
    ) {
      return;
    }

    const confirmado = window.confirm(
      `¿Registrar la entrega de una manilla a ${resultado.nombre ?? "esta persona"}?`,
    );

    if (!confirmado) {
      return;
    }

    setOcupado(true);

    try {
      const respuesta =
        await procesarCodigoRecepcion(
          codigoValidado,
          true,
        );

      setResultado(respuesta);
      setCodigoValidado("");
    } catch {
      setResultado({
        estado: "error",
        mensaje:
          "No pudimos confirmar si se guardó la entrega. Consulta de nuevo el mismo QR antes de entregar una manilla.",
      });

      setCodigoValidado("");
    } finally {
      setOcupado(false);
    }
  }

  function limpiar() {
    setCodigo("");
    setCodigoValidado("");
    setResultado(null);
  }

  const etiquetaTipo =
    resultado?.tipo === "lider"
      ? "Líder"
      : resultado?.tipo === "staff"
        ? "Staff"
        : resultado?.tipo === "asistente"
          ? "Asistente"
          : "";

  const claseBotonSecundario =
    "rounded-xl border border-[#D8C38A] bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:bg-[#FBF6E8] disabled:opacity-60";

  return (
    <div className="space-y-6">
      <form onSubmit={consultar} className="space-y-4">
        <div>
          <label
            htmlFor="codigo-qr"
            className="block text-sm font-medium text-neutral-800"
          >
            Código de la invitación
          </label>

          <input
            id="codigo-qr"
            type="text"
            required
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={80}
            value={codigo}
            disabled={ocupado}
            onChange={(evento) => {
              setCodigo(evento.target.value);
              setCodigoValidado("");
              setResultado(null);
            }}
            placeholder="RYG1.…"
            className="mt-2 w-full rounded-xl border border-[#D8D1BF] bg-white px-4 py-3 text-sm text-neutral-950 outline-none focus:border-[#A87912] focus:ring-2 focus:ring-[#D9B65D]/25 disabled:opacity-60"
          />

          <p className="mt-2 text-xs leading-5 text-neutral-500">
            Pega el contenido del QR o utiliza un lector
            que lo escriba en este campo.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={ocupado || !codigo.trim()}
            className="rounded-xl bg-gradient-to-r from-[#A87912] via-[#E4C366] to-[#B88A20] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {ocupado ? "Procesando..." : "Consultar QR"}
          </button>

          <button
            type="button"
            onClick={limpiar}
            disabled={ocupado}
            className={claseBotonSecundario}
          >
            Limpiar
          </button>
        </div>
      </form>

      {resultado ? (
        <section
          aria-live="polite"
          aria-atomic="true"
          className={`rounded-2xl border p-5 ${
            resultado.estado === "error"
              ? "border-red-200 bg-red-50"
              : "border-[#E4D3A1] bg-[#FBF6E8]"
          }`}
        >
          <h2 className="text-lg font-semibold">
            {resultado.estado === "valido"
              ? "Invitación válida"
              : resultado.estado === "registrado"
                ? "Entrega registrada"
                : resultado.estado === "ya_registrado"
                  ? "Manilla ya entregada"
                  : "No autorizar entrega"}
          </h2>

          {resultado.nombre ? (
            <p className="mt-3 text-lg font-medium">
              {resultado.nombre}
            </p>
          ) : null}

          {etiquetaTipo ? (
            <p className="mt-1 text-sm text-neutral-600">
              {etiquetaTipo}
            </p>
          ) : null}

          <p className="mt-3 text-sm leading-6">
            {resultado.mensaje}
          </p>

          {resultado.fecha ? (
            <p className="mt-2 text-xs text-neutral-600">
              Registro:{" "}
              {new Intl.DateTimeFormat("es-CO", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "America/Bogota",
              }).format(new Date(resultado.fecha))}
            </p>
          ) : null}

          {resultado.estado === "valido" ? (
            <button
              type="button"
              onClick={() => void confirmarEntrega()}
              disabled={ocupado}
              className="mt-5 w-full rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60 sm:w-auto"
            >
              {ocupado
                ? "Registrando..."
                : "Confirmar entrega de manilla"}
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}