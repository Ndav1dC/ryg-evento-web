"use client";

import { useRef, useState } from "react";
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
import SuccessStep from "@/components/registration/steps/SuccessStep";

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
  codigo: string;
};

type SubmissionPayload = {
  solicitud_id: string;
  codigo: string;
  nombre: string;
  whatsapp: string;
  municipio: string;
  organizacion: string;
};

type SubmissionResponse = {
  ok: boolean;
  error?: string;
};

function isSubmissionResponse(
  value: unknown,
): value is SubmissionResponse {
  if (
    typeof value !== "object" ||
    value === null ||
    !("ok" in value) ||
    typeof value.ok !== "boolean"
  ) {
    return false;
  }

  return (
    !("error" in value) ||
    value.error === undefined ||
    typeof value.error === "string"
  );
}

export default function RegistrationFlow({
  tipo,
  codigo,
}: Props) {
  const reduceMotion = useReducedMotion();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [data, setData] = useState<RegistrationFormData>(() => ({
    ...initialRegistrationData,
    area: tipo === "staff" ? "MEDIOS" : "",
  }));

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryLocked, setRetryLocked] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const sendingRef = useRef(false);
  const pendingSubmissionRef =
    useRef<SubmissionPayload | null>(null);

  const lastStep = getLastStep(tipo);

  function updateField(
    field: RegistrationField,
    value: string,
  ) {
    if (
      sendingRef.current ||
      pendingSubmissionRef.current ||
      submitted
    ) {
      return;
    }

    setData((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  function goToStep(nextStep: number) {
    if (
      sendingRef.current ||
      pendingSubmissionRef.current ||
      submitted
    ) {
      return;
    }

    if (nextStep < 0 || nextStep > lastStep) {
      return;
    }

    setDirection(nextStep > step ? 1 : -1);
    setError("");
    setStep(nextStep);
  }

  function goNext() {
    if (sendingRef.current || submitted) {
      return;
    }

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

  async function handleSubmit() {
    if (
      sendingRef.current ||
      submitted ||
      step !== lastStep
    ) {
      return;
    }

    if (tipo === "staff") {
      setError("El envío de staff todavía no está habilitado.");
      return;
    }

    if (!pendingSubmissionRef.current) {
      for (
        let validationStep = 1;
        validationStep < lastStep;
        validationStep += 1
      ) {
        const validationError = validateRegistrationStep(
          tipo,
          validationStep,
          data,
        );

        if (validationError) {
          goToStep(validationStep);
          setError(validationError);
          return;
        }
      }

      pendingSubmissionRef.current = {
        solicitud_id: crypto.randomUUID(),
        codigo,
        nombre: data.nombre,
        whatsapp: data.whatsapp,
        municipio: data.municipio,
        organizacion:
          tipo === "lider" ? data.organizacion : "",
      };
    }

    const payload = pendingSubmissionRef.current;

    sendingRef.current = true;
    setIsSubmitting(true);
    setRetryLocked(true);
    setError("");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 20000);

    try {
      const response = await fetch("/api/inscripciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const result: unknown = await response.json();

      if (!isSubmissionResponse(result)) {
        throw new Error("Respuesta inesperada del servidor.");
      }

      if (response.ok && result.ok) {
        setSubmitted(true);
        setRetryLocked(false);
        return;
      }

      const rejectedBeforeInsert = [
        400,
        403,
        404,
        415,
        422,
      ].includes(response.status);

      if (!result.ok && rejectedBeforeInsert) {
        pendingSubmissionRef.current = null;
        setRetryLocked(false);
      }

      const message =
        result.error ?? "No fue posible procesar tu solicitud.";

      setError(
        !result.ok && rejectedBeforeInsert
          ? message
          : `${message} No cambies ni recargues esta página; ` +
              "reintenta el envío con el botón.",
      );
    } catch {
      setError(
        "No pudimos confirmar si tu solicitud fue recibida. " +
          "No recargues esta página. Pulsa “Reintentar envío”; " +
          "conservaremos la misma clave y los mismos datos.",
      );
    } finally {
      window.clearTimeout(timeoutId);
      sendingRef.current = false;
      setIsSubmitting(false);
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
          equipos={data.equipos}
          onEquiposChange={(value) =>
            updateField("equipos", value)
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
          aria-busy={isSubmitting}
          aria-label={
            submitted
              ? "Solicitud recibida"
              : step === 0
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
          {submitted ? (
            <SuccessStep />
          ) : (
            <>
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
                onSubmit={() => void handleSubmit()}
                isSubmitting={isSubmitting}
                canSubmit={tipo !== "staff"}
                retryLocked={retryLocked}
              />

              {step !== lastStep && (
                <p className="panel-note">
                  Tu invitación con código QR se enviará
                  posteriormente al número de WhatsApp
                  registrado.
                </p>
              )}
            </>
          )}
        </motion.section>
      </div>
    </main>
  );
}