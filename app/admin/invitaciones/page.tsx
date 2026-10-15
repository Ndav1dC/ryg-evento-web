import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requerirSesionPanel } from "@/lib/auth/panel";
import { getConfiguredEventId } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { FormularioInvitacion } from "./formulario-invitacion";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POR_PAGINA = 25;

type InvitacionesPageProps = {
  searchParams: Promise<{
    pagina?: string | string[];
  }>;
};

export default async function InvitacionesPage({
  searchParams,
}: InvitacionesPageProps) {
  const sesion = await requerirSesionPanel();

  if (sesion.rol !== "admin") {
    redirect("/admin");
  }

  const parametros = await searchParams;

  const texto =
    typeof parametros.pagina === "string"
      ? parametros.pagina
      : "";

  const numero = Number(texto);

  const pagina =
    /^[1-9]\d*$/.test(texto) &&
    Number.isSafeInteger(numero) &&
    numero <= 1_000_000
      ? numero
      : 1;

  const supabase = createAdminClient();
  const eventoId = getConfiguredEventId();
  const inicio = (pagina - 1) * POR_PAGINA;

  const { data, error, count } = await supabase
    .from("inscripciones")
    .select(
      "id, nombre_completo, tipo, whatsapp",
      { count: "exact" },
    )
    .eq("evento_id", eventoId)
    .eq("estado", "aprobado")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(inicio, inicio + POR_PAGINA - 1);

  if (error) {
    console.error("[InvitacionesPage:inscripciones]", {
      code: error.code,
    });

    throw new Error(
      "No fue posible cargar las inscripciones aprobadas.",
    );
  }

  const total = count ?? 0;
  const paginas = Math.max(
    1,
    Math.ceil(total / POR_PAGINA),
  );

  if (pagina > paginas) {
    redirect(`/admin/invitaciones?pagina=${paginas}`);
  }

  const inscripciones = data ?? [];
  const ids = inscripciones.map((item) => item.id);

  const invitaciones = new Map<
    string,
    {
      token_hash: string;
      revocada_at: string | null;
    }
  >();

  if (ids.length > 0) {
    const {
      data: existentes,
      error: invitationsError,
    } = await supabase
      .from("invitaciones_qr")
      .select(
        "inscripcion_id, token_hash, revocada_at",
      )
      .in("inscripcion_id", ids);

    if (invitationsError) {
      console.error("[InvitacionesPage:invitaciones]", {
        code: invitationsError.code,
      });

      throw new Error(
        "No fue posible comprobar las invitaciones existentes.",
      );
    }

    for (const invitacion of existentes ?? []) {
      invitaciones.set(
        invitacion.inscripcion_id,
        invitacion,
      );
    }
  }

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
                Invitaciones QR
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
            Inscripciones aprobadas: {total}
          </h2>

          <p className="mt-2 text-sm leading-6 text-neutral-700">
            Genera y descarga el QR de cada persona.
            Emitir un nuevo código invalida el anterior.
            Esta pantalla no envía mensajes de WhatsApp.
          </p>
        </section>

        {inscripciones.length === 0 ? (
          <section className="rounded-3xl border border-[#E7DFC9] bg-white p-8 text-center">
            <h2 className="font-semibold">
              No hay inscripciones aprobadas
            </h2>

            <p className="mt-2 text-sm text-neutral-600">
              Aquí aparecerán las personas con cupo aprobado.
            </p>
          </section>
        ) : (
          inscripciones.map((inscripcion) => {
            const invitacion = invitaciones.get(
              inscripcion.id,
            );

            return (
              <article
                key={inscripcion.id}
                className="rounded-3xl border border-[#E7DFC9] bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {inscripcion.nombre_completo}
                    </h2>

                    <p className="mt-1 text-sm text-neutral-600">
                      {inscripcion.whatsapp}
                    </p>
                  </div>

                  <span className="rounded-full border border-[#E4D3A1] bg-[#FBF6E8] px-3 py-1 text-xs font-medium text-[#765410]">
                    {inscripcion.tipo === "lider"
                      ? "Líder"
                      : inscripcion.tipo === "staff"
                        ? "Staff"
                        : "Asistente"}
                  </span>
                </div>

                <FormularioInvitacion
                  inscripcionId={inscripcion.id}
                  nombre={inscripcion.nombre_completo}
                  hashActual={
                    invitacion?.token_hash ?? null
                  }
                  revocada={
                    invitacion?.revocada_at != null
                  }
                />
              </article>
            );
          })
        )}

        <nav
          aria-label="Paginación de invitaciones"
          className="flex flex-wrap items-center justify-between gap-4 py-3"
        >
          <p className="text-sm text-neutral-600">
            Página {pagina} de {paginas}
          </p>

          <div className="flex gap-3">
            {pagina > 1 ? (
              <Link
                href={`/admin/invitaciones?pagina=${pagina - 1}`}
                className={claseEnlace}
              >
                Anterior
              </Link>
            ) : null}

            {pagina < paginas ? (
              <Link
                href={`/admin/invitaciones?pagina=${pagina + 1}`}
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