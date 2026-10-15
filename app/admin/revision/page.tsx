import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requerirSesionPanel } from "@/lib/auth/panel";
import { getConfiguredEventId } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { FormularioRevision } from "./formulario-revision";

export const dynamic = "force-dynamic";

const POR_PAGINA = 25;

type RevisionPageProps = {
  searchParams: Promise<{
    pagina?: string | string[];
  }>;
};

export default async function RevisionPage({
  searchParams,
}: RevisionPageProps) {
  const sesion = await requerirSesionPanel();

  if (sesion.rol !== "admin") {
    redirect("/admin");
  }

  const parametros = await searchParams;

  const paginaTexto =
    typeof parametros.pagina === "string"
      ? parametros.pagina
      : "";

  const numero = Number(paginaTexto);

  const pagina =
    /^[1-9]\d*$/.test(paginaTexto) &&
    Number.isSafeInteger(numero) &&
    numero <= 1_000_000
      ? numero
      : 1;

  const inicio = (pagina - 1) * POR_PAGINA;

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
        created_at
      `,
      { count: "exact" },
    )
    .eq("evento_id", eventoId)
    .in("estado", ["pendiente", "lista_espera"])
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .range(inicio, inicio + POR_PAGINA - 1);

  if (error) {
    console.error(
      "Error al cargar revisión:",
      error.code,
      error.message,
    );

    throw new Error(
      "No fue posible cargar las solicitudes para revisión.",
    );
  }

  const total = count ?? 0;
  const paginas = Math.max(
    1,
    Math.ceil(total / POR_PAGINA),
  );

  if (pagina > paginas) {
    redirect(`/admin/revision?pagina=${paginas}`);
  }

  const solicitudes = data ?? [];

  const claseEnlace =
    "rounded-xl border border-[#D8C38A] bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-[#FBF6E8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#856013]";

  return (
    <main className="min-h-screen bg-[#FAF8F2] text-[#171717]">
      <div className="h-1.5 bg-gradient-to-r from-[#A87912] via-[#F4DC80] to-[#B88A20]" />

      <header className="border-b border-[#E7DFC9] bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-5 px-5 py-6 sm:px-8">
          <div className="flex items-center gap-4">
            <Image
              src="/logo-reino-y-gloria.png"
              alt="Reino y Gloria"
              width={72}
              height={72}
              priority
              className="h-16 w-16 object-contain"
            />

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#856013]">
                Reino y Gloria
              </p>

              <h1 className="mt-2 text-xl font-semibold">
                Revisión de solicitudes
              </h1>
            </div>
          </div>

          <Link href="/admin" className={claseEnlace}>
            Volver al panel
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-5 px-5 py-8 sm:px-8">
        <section className="rounded-2xl border border-[#E4D3A1] bg-[#FBF6E8] p-5">
          <h2 className="font-semibold">
            Por revisar: {total}
          </h2>

          <p className="mt-2 text-sm leading-6 text-neutral-700">
            Incluye pendientes y lista de espera.
            Revisa los datos antes de guardar una decisión.
            Aprobar consume un cupo, pero todavía no
            genera QR ni envía mensajes.
          </p>
        </section>

        {solicitudes.length === 0 ? (
          <section className="rounded-3xl border border-[#E7DFC9] bg-white p-8 text-center">
            <h2 className="text-lg font-semibold">
              No hay solicitudes por revisar
            </h2>

            <p className="mt-2 text-sm text-neutral-600">
              Las solicitudes pendientes o en lista de
              espera aparecerán aquí.
            </p>
          </section>
        ) : (
          solicitudes.map((solicitud) => {
            if (
              solicitud.estado !== "pendiente" &&
              solicitud.estado !== "lista_espera"
            ) {
              return null;
            }

            return (
              <article
                key={`${solicitud.id}-${solicitud.estado}`}
                className="rounded-3xl border border-[#E7DFC9] bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {solicitud.nombre_completo}
                    </h2>

                    <p className="mt-1 text-sm text-neutral-600">
                      WhatsApp: {solicitud.whatsapp}
                    </p>
                  </div>

                  <span className="rounded-full border border-[#E4D3A1] bg-[#FBF6E8] px-3 py-1 text-xs font-medium text-[#765410]">
                    {solicitud.estado === "pendiente"
                      ? "Pendiente"
                      : "Lista de espera"}
                  </span>
                </div>

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-neutral-500">
                      Tipo
                    </dt>
                    <dd className="mt-1 font-medium">
                      {solicitud.tipo === "lider"
                        ? "Líder"
                        : solicitud.tipo === "staff"
                          ? "Staff"
                          : "Asistente"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-neutral-500">
                      Organización
                    </dt>
                    <dd className="mt-1">
                      {solicitud.organizacion || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-neutral-500">
                      Área de apoyo
                    </dt>
                    <dd className="mt-1">
                      {solicitud.area_apoyo || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-neutral-500">
                      Fecha de solicitud
                    </dt>
                    <dd className="mt-1">
                      {new Intl.DateTimeFormat("es-CO", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "America/Bogota",
                      }).format(
                        new Date(solicitud.created_at),
                      )}
                    </dd>
                  </div>
                </dl>

                <FormularioRevision
                  inscripcionId={solicitud.id}
                  nombre={solicitud.nombre_completo}
                  estadoActual={solicitud.estado}
                />
              </article>
            );
          })
        )}

        <nav
          aria-label="Paginación de revisión"
          className="flex flex-wrap items-center justify-between gap-4 py-3"
        >
          <p className="text-sm text-neutral-600">
            Página {pagina} de {paginas}
          </p>

          <div className="flex gap-3">
            {pagina > 1 ? (
              <Link
                href={`/admin/revision?pagina=${pagina - 1}`}
                className={claseEnlace}
              >
                Anterior
              </Link>
            ) : null}

            {pagina < paginas ? (
              <Link
                href={`/admin/revision?pagina=${pagina + 1}`}
                className={claseEnlace}
              >
                Siguiente
              </Link>
            ) : null}
          </div>
        </nav>
      </div>
    </main>
  );
}