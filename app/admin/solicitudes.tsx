import "server-only";

import { requerirSesionPanel } from "@/lib/auth/panel";
import { getConfiguredEventId } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";

const LIMITE = 50;

function mostrarValor(valor: string | null) {
  if (!valor) {
    return "—";
  }

  return valor.replaceAll("_", " ");
}

function mostrarFecha(valor: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(valor));
}

export async function Solicitudes() {
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

  const supabase = createAdminClient();
  const eventoId = getConfiguredEventId();

  const { data, error, count } = await supabase
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
    .eq("evento_id", eventoId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(LIMITE);

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
        <h2 className="text-lg font-semibold text-neutral-900">
          No fue posible cargar las inscripciones
        </h2>

        <p className="mt-2 text-sm leading-6 text-red-700">
          Intenta actualizar la página. Si el problema
          continúa, revisa la terminal del servidor.
        </p>
      </section>
    );
  }

  const inscripciones = data ?? [];

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
              Todos los estados · Más recientes primero
            </p>
          </div>

          <span className="rounded-full border border-[#E4D3A1] bg-[#FBF6E8] px-4 py-2 text-sm font-semibold text-[#765410]">
            Total: {count ?? 0}
          </span>
        </div>
      </div>

      {inscripciones.length === 0 ? (
        <div className="px-6 py-12 text-center sm:px-8">
          <h3 className="text-base font-semibold">
            Todavía no hay inscripciones
          </h3>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Las solicitudes de este evento aparecerán
            aquí cuando se registren.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-sm">
              <caption className="sr-only">
                Inscripciones más recientes del evento
                configurado.
              </caption>

              <thead className="border-b border-[#EEE7D6] bg-[#FBF8EF] text-[#765410]">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Persona
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Organización / Apoyo
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Respuesta
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Registro
                  </th>
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

                    <td className="px-6 py-4 align-top capitalize text-neutral-700">
                      {mostrarValor(inscripcion.tipo)}
                    </td>

                    <td className="px-6 py-4 align-top text-neutral-700">
                      <p>
                        {mostrarValor(inscripcion.organizacion)}
                      </p>

                      {inscripcion.area_apoyo ? (
                        <p className="mt-1 text-xs text-neutral-500">
                          Apoyo:{" "}
                          {mostrarValor(inscripcion.area_apoyo)}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-6 py-4 align-top">
                      <span className="inline-block rounded-full border border-[#E4D3A1] bg-[#FBF6E8] px-3 py-1 text-xs font-medium capitalize text-[#765410]">
                        {mostrarValor(inscripcion.estado)}
                      </span>
                    </td>

                    <td className="px-6 py-4 align-top capitalize text-neutral-600">
                      {mostrarValor(inscripcion.respuesta)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 align-top text-xs text-neutral-600">
                      {mostrarFecha(inscripcion.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[#EEE7D6] px-6 py-4 text-xs leading-5 text-neutral-500 sm:px-8">
            Mostrando {inscripciones.length} de {count ?? 0}
            {" "}inscripciones. Esta primera vista muestra
            como máximo las {LIMITE} más recientes.
          </div>
        </>
      )}
    </section>
  );
}