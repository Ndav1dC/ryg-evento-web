import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";

import { requerirSesionPanel } from "@/lib/auth/panel";
import { getConfiguredEventId } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";

const POR_PAGINA = 25;

const ESTADOS = [
  { valor: "pendiente", etiqueta: "Pendiente" },
  { valor: "aprobado", etiqueta: "Aprobado" },
  { valor: "lista_espera", etiqueta: "Lista de espera" },
  { valor: "rechazado", etiqueta: "Rechazado" },
  { valor: "cancelado", etiqueta: "Cancelado" },
] as const;

const TIPOS = [
  { valor: "asistente", etiqueta: "Asistente" },
  { valor: "lider", etiqueta: "Líder" },
  { valor: "staff", etiqueta: "Staff" },
] as const;

type Filtros = {
  estado?: string | string[];
  tipo?: string | string[];
  pagina?: string | string[];
};

type SolicitudesProps = {
  filtros: Filtros;
};

function obtenerTexto(
  valor: string | string[] | undefined,
) {
  return typeof valor === "string" ? valor : "";
}

function etiquetaEstado(valor: string) {
  return (
    ESTADOS.find((estado) => estado.valor === valor)
      ?.etiqueta ?? valor
  );
}

function etiquetaTipo(valor: string) {
  return (
    TIPOS.find((tipo) => tipo.valor === valor)
      ?.etiqueta ?? valor
  );
}

function etiquetaRespuesta(valor: string) {
  switch (valor) {
    case "si":
      return "Sí";
    case "no":
      return "No";
    case "sin_respuesta":
      return "Sin respuesta";
    default:
      return valor;
  }
}

function mostrarFecha(valor: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(valor));
}

function enlacePagina(
  pagina: number,
  estado: string,
  tipo: string,
) {
  const parametros = new URLSearchParams();

  if (estado) {
    parametros.set("estado", estado);
  }

  if (tipo) {
    parametros.set("tipo", tipo);
  }

  parametros.set("pagina", String(pagina));

  return `/admin?${parametros.toString()}`;
}

export async function Solicitudes({
  filtros,
}: SolicitudesProps) {
  const sesion = await requerirSesionPanel();

  if (sesion.rol !== "admin") {
    return (
      <section className="rounded-3xl border border-[#E7DFC9] bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold">
          Área de recepción
        </h2>

        <p className="mt-3 text-sm leading-6 text-neutral-600">
          El listado administrativo está reservado para
          administración. Las herramientas de recepción
          se incorporarán en un apartado separado.
        </p>
      </section>
    );
  }

  const estadoSolicitado = obtenerTexto(filtros.estado);
  const tipoSolicitado = obtenerTexto(filtros.tipo);

  const estado =
    ESTADOS.find(
      (opcion) => opcion.valor === estadoSolicitado,
    )?.valor ?? "";

  const tipo =
    TIPOS.find(
      (opcion) => opcion.valor === tipoSolicitado,
    )?.valor ?? "";

  const paginaTexto = obtenerTexto(filtros.pagina);
  const paginaNumero = Number(paginaTexto);

  const pagina =
    /^[1-9]\d*$/.test(paginaTexto) &&
    Number.isSafeInteger(paginaNumero) &&
    paginaNumero <= 1_000_000
      ? paginaNumero
      : 1;

  const inicio = (pagina - 1) * POR_PAGINA;

  const supabase = createAdminClient();
  const eventoId = getConfiguredEventId();

  let consulta = supabase
    .from("inscripciones")
    .select(
      `
        id,
        nombre_completo,
        whatsapp,
        tipo,
        organizacion,
        area_apoyo,
        estado,
        respuesta,
        created_at
      `,
      { count: "exact" },
    )
    .eq("evento_id", eventoId);

  if (estado) {
    consulta = consulta.eq("estado", estado);
  }

  if (tipo) {
    consulta = consulta.eq("tipo", tipo);
  }

  const { data, error, count } = await consulta
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(inicio, inicio + POR_PAGINA - 1);

  if (error) {
    console.error(
      "Error al consultar inscripciones:",
      error.code,
      error.message,
    );

    return (
      <section
        role="alert"
        className="rounded-3xl border border-red-200 bg-white p-6 sm:p-8"
      >
        <h2 className="text-lg font-semibold">
          No fue posible cargar las inscripciones
        </h2>

        <p className="mt-2 text-sm leading-6 text-red-700">
          Actualiza la página. Si el problema continúa,
          revisa la terminal del servidor.
        </p>
      </section>
    );
  }

  const total = count ?? 0;
  const totalPaginas = Math.max(
    1,
    Math.ceil(total / POR_PAGINA),
  );

  if (pagina > totalPaginas) {
    redirect(enlacePagina(totalPaginas, estado, tipo));
  }

  const inscripciones = data ?? [];
  const desde = total === 0 ? 0 : inicio + 1;
  const hasta = inicio + inscripciones.length;

  const claseCampo =
    "mt-2 w-full rounded-xl border border-[#D8D1BF] bg-white px-3 py-2.5 text-sm text-neutral-950 outline-none focus:border-[#A87912] focus:ring-2 focus:ring-[#D9B65D]/25";

  const claseEnlace =
    "rounded-xl border border-[#D8C38A] bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-[#FBF6E8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#856013]";

  return (
    <section
      aria-labelledby="solicitudes"
      className="overflow-hidden rounded-3xl border border-[#E7DFC9] bg-white shadow-sm"
    >
      <div className="border-b border-[#EEE7D6] px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#856013]">
              Gestión del evento
            </p>

            <h2
              id="solicitudes"
              className="mt-2 text-xl font-semibold"
            >
              Solicitudes de inscripción
            </h2>

            <p className="mt-2 text-sm text-neutral-600">
              Más recientes primero.
            </p>
          </div>

          <span className="rounded-full border border-[#E4D3A1] bg-[#FBF6E8] px-4 py-2 text-sm font-semibold text-[#765410]">
            Resultados: {total}
          </span>
        </div>

        <form
          action="/admin"
          method="get"
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end"
        >
          <div>
            <label
              htmlFor="filtro-estado"
              className="text-sm font-medium text-neutral-800"
            >
              Estado
            </label>

            <select
              key={`estado-${estado}`}
              id="filtro-estado"
              name="estado"
              defaultValue={estado}
              className={claseCampo}
            >
              <option value="">Todos los estados</option>

              {ESTADOS.map((opcion) => (
                <option
                  key={opcion.valor}
                  value={opcion.valor}
                >
                  {opcion.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filtro-tipo"
              className="text-sm font-medium text-neutral-800"
            >
              Tipo de inscripción
            </label>

            <select
              key={`tipo-${tipo}`}
              id="filtro-tipo"
              name="tipo"
              defaultValue={tipo}
              className={claseCampo}
            >
              <option value="">Todos los tipos</option>

              {TIPOS.map((opcion) => (
                <option
                  key={opcion.valor}
                  value={opcion.valor}
                >
                  {opcion.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-[#A87912] via-[#E4C366] to-[#B88A20] px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#856013]"
          >
            Aplicar filtros
          </button>

          <Link
            href="/admin"
            className={`${claseEnlace} text-center`}
          >
            Limpiar
          </Link>
        </form>
      </div>

      {inscripciones.length === 0 ? (
        <div className="px-6 py-12 text-center sm:px-8">
          <h3 className="text-base font-semibold">
            No hay inscripciones para esta vista
          </h3>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Prueba con otros filtros o pulsa «Limpiar».
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left text-sm">
            <caption className="sr-only">
              Inscripciones del evento según los filtros
              seleccionados.
            </caption>

            <thead className="border-b border-[#EEE7D6] bg-[#FBF8EF] text-[#765410]">
              <tr>
                {[
                  "Persona",
                  "Tipo",
                  "Organización / Apoyo",
                  "Estado",
                  "Respuesta",
                  "Registro",
                ].map((titulo) => (
                  <th
                    key={titulo}
                    scope="col"
                    className="px-6 py-4 font-semibold"
                  >
                    {titulo}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F0EBDF]">
              {inscripciones.map((inscripcion) => (
                <tr
                  key={inscripcion.id}
                  className="transition hover:bg-[#FDFBF5]"
                >
                  <td className="px-6 py-4 align-top">
                    <p className="font-medium text-neutral-950">
                      {inscripcion.nombre_completo}
                    </p>

                    <p className="mt-1 text-xs text-neutral-600">
                      {inscripcion.whatsapp}
                    </p>
                  </td>

                  <td className="px-6 py-4 align-top text-neutral-700">
                    {etiquetaTipo(inscripcion.tipo)}
                  </td>

                  <td className="px-6 py-4 align-top text-neutral-700">
                    <p>
                      {inscripcion.organizacion || "—"}
                    </p>

                    {inscripcion.area_apoyo ? (
                      <p className="mt-1 text-xs text-neutral-500">
                        Apoyo: {inscripcion.area_apoyo}
                      </p>
                    ) : null}
                  </td>

                  <td className="px-6 py-4 align-top">
                    <span className="inline-block whitespace-nowrap rounded-full border border-[#E4D3A1] bg-[#FBF6E8] px-3 py-1 text-xs font-medium text-[#765410]">
                      {etiquetaEstado(inscripcion.estado)}
                    </span>
                  </td>

                  <td className="px-6 py-4 align-top text-neutral-600">
                    {etiquetaRespuesta(inscripcion.respuesta)}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 align-top text-xs text-neutral-600">
                    {mostrarFecha(inscripcion.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-4 border-t border-[#EEE7D6] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-xs leading-5 text-neutral-600">
          Mostrando {desde}–{hasta} de {total}.
          {" "}Página {pagina} de {totalPaginas}.
        </p>

        <nav
          aria-label="Paginación de inscripciones"
          className="flex items-center gap-3"
        >
          {pagina > 1 ? (
            <Link
              href={enlacePagina(pagina - 1, estado, tipo)}
              className={claseEnlace}
            >
              Anterior
            </Link>
          ) : null}

          {pagina < totalPaginas ? (
            <Link
              href={enlacePagina(pagina + 1, estado, tipo)}
              className={claseEnlace}
            >
              Siguiente
            </Link>
          ) : null}
        </nav>
      </div>
    </section>
  );
}