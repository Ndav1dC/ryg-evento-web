"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function LoginForm() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError("");

    const respuesta = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correo,
        contrasena,
      }),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.ok) {
      setError(
        datos.error ?? "No fue posible iniciar sesión.",
      );
      return;
    }

    startTransition(() => {
      router.replace("/admin");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={enviar}
      className="mt-6 space-y-4"
    >
      <div>
        <label
          htmlFor="correo"
          className="block text-sm font-medium text-neutral-800"
        >
          Correo
        </label>

        <input
          id="correo"
          type="email"
          required
          autoComplete="email"
          value={correo}
          onChange={(evento) =>
            setCorreo(evento.target.value)
          }
          className="mt-2 w-full rounded-xl border border-[#D8D1BF] bg-white px-4 py-3 text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-[#A87912] focus:ring-2 focus:ring-[#D9B65D]/25"
        />
      </div>

      <div>
        <label
          htmlFor="contrasena"
          className="block text-sm font-medium text-neutral-800"
        >
          Contraseña
        </label>

        <input
          id="contrasena"
          type="password"
          required
          autoComplete="current-password"
          value={contrasena}
          onChange={(evento) =>
            setContrasena(evento.target.value)
          }
          className="mt-2 w-full rounded-xl border border-[#D8D1BF] bg-white px-4 py-3 text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-[#A87912] focus:ring-2 focus:ring-[#D9B65D]/25"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-gradient-to-r from-[#A87912] via-[#E4C366] to-[#B88A20] px-4 py-3 font-semibold text-black shadow-sm transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#856013] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}