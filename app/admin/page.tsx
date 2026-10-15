import Image from "next/image";

import { requerirSesionPanel } from "@/lib/auth/panel";
import { cerrarSesion } from "./actions";
import { Solicitudes } from "./solicitudes";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    estado?: string | string[];
    tipo?: string | string[];
    pagina?: string | string[];
  }>;
};

export default async function AdminPage({
  searchParams,
}: AdminPageProps) {
  const sesion = await requerirSesionPanel();
  const filtros = await searchParams;

  const esAdmin = sesion.rol === "admin";

  const nombreRol = esAdmin
    ? "Administración"
    : "Recepción";

  return (
    <main className="min-h-screen bg-[#FAF8F2] text-[#171717]">
      <div className="h-1.5 bg-gradient-to-r from-[#A87912] via-[#F4DC80] to-[#B88A20]" />

      <header className="border-b border-[#E7DFC9] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-4">
            <Image
              src="/logo-reino-y-gloria.png"
              alt="Reino y Gloria"
              width={88}
              height={88}
              priority
              className="h-20 w-20 shrink-0 object-contain"
            />

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#856013]">
                Reino y Gloria
              </p>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Panel del evento
              </h1>

              <p className="mt-1 text-sm text-neutral-600">
                Espacio privado del equipo autorizado.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#E4D3A1] bg-[#FBF6E8] px-4 py-2 text-xs font-semibold text-[#765410]">
              {nombreRol}
            </span>

            <form action={cerrarSesion}>
              <button
                type="submit"
                className="rounded-xl border border-[#D8C38A] bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-[#FBF6E8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#856013]"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-5 py-8 sm:px-8 sm:py-10">
        <section
          aria-labelledby="bienvenida"
          className="relative overflow-hidden rounded-3xl border border-[#E1D3AC] bg-white p-6 shadow-sm sm:p-8"
        >
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#A87912] via-[#F4DC80] to-[#B88A20]"
          />

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#856013]">
            Sesión iniciada
          </p>

          <h2
            id="bienvenida"
            className="mt-3 text-xl font-semibold sm:text-2xl"
          >
            Bienvenido al equipo
          </h2>

          <p className="mt-3 break-words text-sm text-neutral-600">
            {sesion.correo}
          </p>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
            {esAdmin
              ? "Este es tu espacio para revisar las solicitudes y coordinar la gestión del evento."
              : "Este es tu espacio para apoyar la recepción y el control de ingreso al evento."}
          </p>
        </section>

        <Solicitudes filtros={filtros} />

        <footer className="pb-4 text-center text-xs leading-5 text-neutral-500">
          Reino y Gloria · Panel privado del evento
        </footer>
      </div>
    </main>
  );
}