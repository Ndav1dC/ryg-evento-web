"use client";

import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";

import BrandHeader from "@/components/shared/BrandHeader";
import RegistrationIntro from "@/components/registration/RegistrationIntro";
import RegistrationProgress from "@/components/registration/RegistrationProgress";
import RegistrationActions from "@/components/registration/RegistrationActions";

import WelcomeStep from "@/components/registration/steps/WelcomeStep";
import PersonalDataStep from "@/components/registration/steps/PersonalDataStep";
import MunicipalityStep from "@/components/registration/steps/MunicipalityStep";
import OrganizationStep from "@/components/registration/steps/OrganizationStep";
import StaffAreaStep from "@/components/registration/steps/StaffAreaStep";
import ReviewStep from "@/components/registration/steps/ReviewStep";

import {
  getLastStep,
  initialRegistrationData,
  registrationCopy,
} from "@/lib/registration/config";
import { validateRegistrationStep } from "@/lib/registration/validation";

import type {
  RegistrationField,
  RegistrationFormData,
  RegistrationType,
} from "@/types/registration";

type Props = {
  tipo: RegistrationType;
};

export default function RegistrationFlow({
  tipo,
}: Props) {
  const reduceMotion = useReducedMotion();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<RegistrationFormData>(
    initialRegistrationData,
  );
  const [error, setError] = useState("");

  const lastStep = getLastStep(tipo);

  function updateField(
    field: RegistrationField,
    value: string,
  ) {
    setData((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  function goToStep(nextStep: number) {
    setDirection(nextStep > step ? 1 : -1);
    setError("");
    setStep(nextStep);
  }

  function goNext() {
    const validationError = validateRegistrationStep(
      tipo,
      step,
      data,
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    if (step < lastStep) {
      goToStep(step + 1);
    }
  }

  function renderStep() {
    if (step === 0) {
      return <WelcomeStep />;
    }

    if (step === 1) {
      return (
        <PersonalDataStep
          data={data}
          onChange={updateField}
        />
      );
    }

    if (step === 2 && tipo === "staff") {
      return (
        <StaffAreaStep
          value={data.area}
          onChange={(value) =>
            updateField("area", value)
          }
        />
      );
    }

    if (step === 2) {
      return (
        <MunicipalityStep
          value={data.municipio}
          onChange={(value) =>
            updateField("municipio", value)
          }
        />
      );
    }

    if (step === 3 && tipo === "lider") {
      return (
        <OrganizationStep
          value={data.organizacion}
          onChange={(value) =>
            updateField("organizacion", value)
          }
        />
      );
    }

    return <ReviewStep tipo={tipo} data={data} />;
  }

  const stepAnimation = reduceMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      }
    : {
        initial: {
          opacity: 0,
          x: direction * 22,
        },
        animate: {
          opacity: 1,
          x: 0,
        },
        exit: {
          opacity: 0,
          x: direction * -22,
        },
      };

  return (
    <main className="site-shell">
      <BrandHeader />

      <div
        className={`registration-layout container ${
          step > 0
            ? "registration-layout--in-progress"
            : ""
        }`}
      >
        <RegistrationIntro tipo={tipo} step={step} />

        <motion.section
          className="form-panel"
          aria-label={
            step === 0
              ? "Bienvenida al evento"
              : `Formulario de inscripción de ${registrationCopy[tipo].title}`
          }
          initial={
            reduceMotion
              ? false
              : { opacity: 0, y: 28 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.65,
            delay: 0.16,
          }}
        >
          <RegistrationProgress
            step={step}
            lastStep={lastStep}
          />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              {...stepAnimation}
              transition={{
                duration: 0.28,
                ease: "easeOut",
              }}
              className="step-content"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}

          <RegistrationActions
            step={step}
            lastStep={lastStep}
            onPrevious={() => goToStep(step - 1)}
            onNext={goNext}
          />

          {step !== lastStep && (
            <p className="panel-note">
              Tu invitación con código QR se enviará
              posteriormente al número de WhatsApp
              registrado.
            </p>
          )}
        </motion.section>
      </div>
    </main>
  );
}