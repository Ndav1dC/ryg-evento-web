import { motion, useReducedMotion } from "motion/react";
import { registrationCopy } from "@/lib/registration/config";
import type { RegistrationType } from "@/types/registration";

type Props = {
  tipo: RegistrationType;
  step: number;
};

export default function RegistrationIntro({
  tipo,
  step,
}: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className="intro-column"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65 }}
    >
      <p className="eyebrow">Reino y Gloria · Evento</p>

      <h1 className="intro-title display-font">
        {step === 0 ? (
          <>
            Bienvenido a este <em>encuentro.</em>
          </>
        ) : (
          <>
            Inscripción de{" "}
            <em>{registrationCopy[tipo].title}.</em>
          </>
        )}
      </h1>

      <p className="intro-description">
        {step === 0
          ? "Nos alegra que estés aquí. Comienza tu inscripción y prepara tu lugar en este encuentro."
          : registrationCopy[tipo].description}
      </p>

      <div className="intro-rule" aria-hidden="true" />

      <p className="intro-footnote">
        Completa tus datos con calma. Podrás revisarlos antes
        de enviarlos.
      </p>
    </motion.section>
  );
}