import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";
import { obtenerSesionPanel } from "@/lib/auth/panel";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const sesion = await obtenerSesionPanel();

  if (sesion) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF8F2] px-4 py-10 text-[#171717]">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-[#D8C38A] bg-white shadow-xl shadow-black/5">
        <div className="h-1.5 bg-gradient-to-r from-[#A87912] via-[#F4DC80] to-[#B88A20]" />

        <div className="px-6 py-8 sm:px-10">
          <div className="flex justify-center">
            <Image
              src="/logo-reino-y-gloria.png"
              alt="Reino y Gloria"
              width={180}
              height={180}
              priority
              className="h-auto w-40 object-contain"
            />
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#856013]">
              Reino y Gloria
            </p>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Acceso al panel
            </h1>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Ingresa con tu cuenta autorizada para
              administrar el evento.
            </p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-xs leading-5 text-neutral-500">
            Acceso exclusivo para el equipo autorizado.
          </p>
        </div>
      </section>
    </main>
  );
}