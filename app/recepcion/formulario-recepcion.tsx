"use client";

import {
  useCallback,
  useRef,
  useState,
} from "react";
import type { FormEvent } from "react";

import {
  procesarCodigoRecepcion,
  type ResultadoRecepcion,
} from "./actions";
import { LectorCamara } from "./lector-camara";

export function FormularioRecepcion() {
  const [codigo, setCodigo] = useState("");
  const [codigoValidado, setCodigoValidado] =
    useState("");
  const [resultado, setResultado] =
    useState<ResultadoRecepcion | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [camaraActiva, setCamaraActiva] =
    useState(false);

  const procesandoRef = useRef(false);

  const consultarToken = useCallback(
    async (valor: string) => {
      if (procesandoRef.current) {
        return;
      }

      const token = valor.trim();

      procesandoRef.current = true;
      setOcupado(true);
      setCamaraActiva(false);
      setCodigo(token);
      setResultado(null);
      setCodigoValidado("");

      try {
        const respuesta =
          await procesarCodigoRecepcion(
            token,
            false,
          );

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
        procesandoRef.current = false;
        setOcupado(false);
      }
    },
    [],
  );

  const alDetectar = useCallback(
    (valor: string) => {
      void consultarToken(valor);
    },
    [consultarToken],
  );

  function consultar(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();
    void consultarToken(codigo);
  }

  async function confirmarEntrega() {
    if (
      procesandoRef.current ||
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

    procesandoRef.current = true;
    setOcupado(true);
    setCamaraActiva(false);

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
      procesandoRef.current = false;
      setOcupado(false);
    }
  }

  function limpiar() {
    if (procesandoRef.current) {
      return;
    }

    setCamaraActiva(false);
    setCodigo("");
    setCodigoValidado("");
    setResultado(null);
  }

  function activarCamara() {
    if (procesandoRef.current) {
      return;
    }

    setResultado(null);
    setCodigoValidado("");
    setCodigo("");
    setCamaraActiva(true);
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
    "rounded-xl border border-[#D8C38A] bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:bg-[#FBF6E8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#856013] disabled:opacity-60";

  return (
    <div className="space-y-6">
      <section
        aria-label="Escaneo con cámara"
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          {!camaraActiva ? (
            <button
              type="button"
              onClick={activarCamara}
              disabled={ocupado}
              className={claseBotonSecundario}
            >
              Activar cámara
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCamaraActiva(false)}
              className={claseBotonSecundario}
            >
              Detener cámara
            </button>
          )}

          <p className="text-xs leading-5 text-neutral-500">
            Escanear consulta la invitación; no registra
            la entrega automáticamente.
          </p>
        </div>

        {camaraActiva ? (
          <LectorCamara onDetectado={alDetectar} />
        ) : null}
      </section>

      <form
        onSubmit={consultar}
        className="space-y-4 border-t border-[#EEE7D6] pt-5"
      >
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
            disabled={ocupado || camaraActiva}
            onChange={(evento) => {
              setCodigo(evento.target.value);
              setCodigoValidado("");
              setResultado(null);
            }}
            placeholder="RYG1.…"
            className="mt-2 w-full rounded-xl border border-[#D8D1BF] bg-white px-4 py-3 text-sm text-neutral-950 outline-none focus:border-[#A87912] focus:ring-2 focus:ring-[#D9B65D]/25 disabled:opacity-60"
          />

          <p className="mt-2 text-xs leading-5 text-neutral-500">
            También puedes pegar el contenido del QR
            o utilizar un lector que lo escriba en este
            campo.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={
              ocupado ||
              camaraActiva ||
              !codigo.trim()
            }
            className="rounded-xl bg-gradient-to-r from-[#A87912] via-[#E4C366] to-[#B88A20] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#856013] disabled:cursor-not-allowed disabled:opacity-60"
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
              className="mt-5 w-full rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#856013] disabled:opacity-60 sm:w-auto"
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