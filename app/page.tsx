"use client";

import Image from "next/image";
import { motion } from "motion/react";

export default function Home() {
  return (
    <main className="site-shell welcome-page">
      <header className="topbar container">
        <div className="brand">
          <Image
            src="/logo-reino-y-gloria.png"
            alt="Reino y Gloria"
            width={92}
            height={58}
            className="brand-logo"
            priority
          />

          <span className="brand-caption">Inscripciones al evento</span>
        </div>

        <span className="topbar-note">Un encuentro que transforma</span>
      </header>

      <section className="welcome-hero container">
        <motion.div
          className="welcome-copy"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          <p className="eyebrow">Reino y Gloria · Evento</p>

          <h1 className="welcome-title display-font">
            Bienvenido a este <em>encuentro.</em>
          </h1>

          <p className="welcome-description">
            Has recibido un enlace de inscripción. Completa tus datos para
            confirmar tu participación y recibir posteriormente tu invitación
            personal.
          </p>

          <div className="welcome-line" aria-hidden="true" />
        </motion.div>

        <motion.div
          className="welcome-card"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: "easeOut" }}
        >
          <div className="welcome-card-mark" aria-hidden="true">
            ✦
          </div>

          <p className="welcome-card-label">Tu inscripción comienza aquí</p>

          <h2 className="welcome-card-title display-font">
            Unos momentos para preparar tu lugar.
          </h2>

          <p className="welcome-card-text">
            El formulario que verás corresponde al enlace que recibiste.
            Continúa cuando estés listo.
          </p>

          <button
            type="button"
            className="button-primary welcome-button"
            onClick={() => {
              window.history.back();
            }}
          >
            Comenzar inscripción <span aria-hidden="true">→</span>
          </button>

          <p className="welcome-card-note">
            Tu información será utilizada únicamente para la organización del
            evento.
          </p>
        </motion.div>
      </section>
    </main>
  );
} 