import Image from "next/image";
import Link from "next/link";

import { requerirSesionPanel } from "@/lib/auth/panel";
import { cerrarSesion } from "@/app/admin/actions";

import { FormularioRecepcion } from "./formulario-recepcion";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function RecepcionPage() {
  const sesion = await requerirSesionPanel();

  const fechaPrueba =
    process.env.NODE_ENV === "development" &&
    sesion.rol === "admin"
      ? process.env.RECEPCION_FECHA_PRUEBA?.trim()
      : undefined;

  return (
    <main className="min-h-screen bg-[#FAF8F2] text-[#171717]">
      <div className="h-1.5 bg-gradient-to-r from-[#A87912] via-[#F4DC80] to-[#B88A20]" />

      <header className="border-b border-[#E7DFC9] bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-5 px-5 py-6 sm:px-8">
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
                Recepción y manillas
              </h1>
            </div>
          </div>

          <form action={cerrarSesion}>
            <button
              type="submit"
              className="rounded-xl border border-[#D8C38A] bg-white px-4 py-2 text-sm font-medium transition hover:bg-[#FBF6E8]"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-5 px-5 py-8 sm:px-8">
        {fechaPrueba ? (
          <p
            role="status"
            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            Prueba local con fecha simulada:{" "}
            {fechaPrueba}. Confirmar la entrega sí guarda
            un check-in real en la base de datos.
          </p>
        ) : null}

        <section className="rounded-3xl border border-[#E7DFC9] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#856013]">
            Control de ingreso
          </p>

          <h2 className="mt-3 text-xl font-semibold">
            Verificar invitación
          </h2>

          <p className="mb-6 mt-3 text-sm leading-6 text-neutral-600">
            Consulta el QR, verifica a la persona y
            registra una sola entrega de manilla.
            Consultar no registra el ingreso.
          </p>

          <FormularioRecepcion />
        </section>

        <section className="rounded-2xl border border-[#E4D3A1] bg-[#FBF6E8] p-5 text-sm leading-6 text-neutral-700">
          <p>
            Staff y líderes: del 27 de octubre al 1 de
            noviembre de 2026.
          </p>

          <p className="mt-2">
            Asistentes: únicamente el 1 de noviembre.
          </p>

          <p className="mt-2">
            La primera entrega consume el QR. Los
            accesos posteriores se controlan con la manilla.
          </p>
        </section>

        {sesion.rol === "admin" ? (
          <Link
            href="/admin"
            className="inline-block text-sm font-medium text-[#856013] underline underline-offset-4"
          >
            Volver a administración
          </Link>
        ) : null}
      </div>
    </main>
  );
}