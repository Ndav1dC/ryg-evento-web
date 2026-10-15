import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requerirSesionPanel } from "@/lib/auth/panel";
import { getConfiguredEventId } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { FormularioConfiguracion } from "./formulario-configuracion";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const sesion = await requerirSesionPanel();

  if (sesion.rol !== "admin") {
    redirect("/admin");
  }

  const supabase = createAdminClient();
  const eventoId = getConfiguredEventId();

  const { data: evento, error } = await supabase
    .from("eventos")
    .select(
      "nombre, capacidad_maxima, cupos_ocupados, inscripciones_abiertas",
    )
    .eq("id", eventoId)
    .single();

  if (error || !evento) {
    console.error(
      "[ConfiguracionPage]",
      error?.code,
      error?.message,
    );

    throw new Error(
      "No fue posible cargar la configuración del evento.",
    );
  }

  const disponibles =
    evento.capacidad_maxima === null
      ? null
      : evento.capacidad_maxima -
        evento.cupos_ocupados;

  const indicadores = [
    {
      titulo: "Capacidad total",
      valor: evento.capacidad_maxima ?? "Sin configurar",
    },
    {
      titulo: "Cupos ocupados",
      valor: evento.cupos_ocupados,
    },
    {
      titulo: "Cupos disponibles",
      valor: disponibles ?? "Sin configurar",
    },
  ];

  return (
    <main className="min-h-screen bg-[#FAF8F2] text-[#171717]">
      <div className="h-1.5 bg-gradient-to-r from-[#A87912] via-[#F4DC80] to-[#B88A20]" />

      <header className="border-b border-[#E7DFC9] bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-5 px-5 py-6 sm:px-8">
          <div className="flex items-center gap-4">
            <Image
              src="/logo-reino-y-gloria.png"
              alt="Reino y Gloria"
              width={80}
              height={80}
              priority
              className="h-20 w-20 object-contain"
            />

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#856013]">
                Reino y Gloria
              </p>

              <h1 className="mt-2 text-xl font-semibold sm:text-2xl">
                Configuración del evento
              </h1>
            </div>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-[#D8C38A] bg-white px-4 py-2 text-sm font-medium transition hover:bg-[#FBF6E8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#856013]"
          >
            Volver al panel
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-5 py-8 sm:px-8">
        <section className="rounded-3xl border border-[#E1D3AC] bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#856013]">
                Evento activo
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                {evento.nombre}
              </h2>
            </div>

            <span className="rounded-full border border-[#E4D3A1] bg-[#FBF6E8] px-4 py-2 text-sm font-medium text-[#765410]">
              {evento.inscripciones_abiertas
                ? "Inscripciones abiertas"
                : "Inscripciones cerradas"}
            </span>
          </div>
        </section>

        <section
          aria-label="Resumen de cupos"
          className="grid gap-4 sm:grid-cols-3"
        >
          {indicadores.map((indicador) => (
            <div
              key={indicador.titulo}
              className="rounded-2xl border border-[#E7DFC9] bg-white p-5"
            >
              <p className="text-sm text-neutral-600">
                {indicador.titulo}
              </p>

              <p className="mt-3 text-3xl font-semibold text-[#765410]">
                {indicador.valor}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-[#E7DFC9] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold">
            Capacidad y apertura del registro
          </h2>

          <p className="mb-6 mt-2 text-sm leading-6 text-neutral-600">
            Las nuevas inscripciones se aprueban
            automáticamente mientras el registro esté
            abierto y existan cupos disponibles.
          </p>

          <FormularioConfiguracion
            capacidad={evento.capacidad_maxima}
            abierto={evento.inscripciones_abiertas}
          />
        </section>

        <p className="text-xs leading-5 text-neutral-500">
          Los indicadores se actualizan al cargar la
          página y después de guardar. No son un contador
          en tiempo real.
        </p>
      </div>
    </main>
  );
}