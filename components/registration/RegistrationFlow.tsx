"use client";

import {
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
import {
  clearSubmissionSession,
  readSubmissionSession,
  savePendingSubmission,
  saveReceivedSubmission,
  type SubmissionPayload,
  type SubmissionSession,
} from "@/lib/registration/submission-session";
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

type InitialSession = {
  session: SubmissionSession | null;
  failed: boolean;
};

type SubmissionResponse = {
  ok: boolean;
  error?: string;
};

function subscribeToClient() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

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

export default function RegistrationFlow(props: Props) {
  const isClient = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (!isClient) {
    return (
      <main className="site-shell">
        <BrandHeader />

        <div className="container">
          <p className="panel-note" role="status">
            Preparando tu inscripción…
          </p>
        </div>
      </main>
    );
  }

  return <RegistrationFlowClient {...props} />;
}

function RegistrationFlowClient({
  tipo,
  codigo,
}: Props) {
  const reduceMotion = useReducedMotion();
  const lastStep = getLastStep(tipo);

  const [initialSession] = useState<InitialSession>(() => {
    try {
      return {
        session: readSubmissionSession(codigo),
        failed: false,
      };
    } catch {
      return {
        session: null,
        failed: true,
      };
    }
  });

  const restoredPayload =
    initialSession.session?.status === "pending"
      ? initialSession.session.payload
      : null;

  const [step, setStep] = useState(
    initialSession.session ? lastStep : 0,
  );
  const [direction, setDirection] = useState(1);

  const [data, setData] = useState<RegistrationFormData>(() => ({
    ...initialRegistrationData,
    area: tipo === "staff" ? "MEDIOS" : "",
    ...(restoredPayload
      ? {
          nombre: restoredPayload.nombre,
          whatsapp: restoredPayload.whatsapp,
          municipio: restoredPayload.municipio,
          organizacion: restoredPayload.organizacion,
          equipos: restoredPayload.equipos,
          disponibilidadCompleta:
            restoredPayload.disponibilidad_completa,
        }
      : {}),
  }));

  const [error, setError] = useState(
    restoredPayload
      ? "Recuperamos una solicitud cuyo resultado no estaba " +
          "confirmado. Pulsa “Reintentar envío” para comprobarla."
      : "",
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryLocked, setRetryLocked] = useState(
    restoredPayload !== null,
  );
  const [submitted, setSubmitted] = useState(
    initialSession.session?.status === "received",
  );

  const sendingRef = useRef(false);

  const pendingSubmissionRef =
    useRef<SubmissionPayload | null>(
      restoredPayload
        ? {
            ...restoredPayload,
            codigo,
          }
        : null,
    );

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

  function updateDisponibilidad(value: boolean) {
    if (
      sendingRef.current ||
      pendingSubmissionRef.current ||
      submitted
    ) {
      return;
    }

    setData((current) => ({
      ...current,
      disponibilidadCompleta: value,
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
      initialSession.failed ||
      sendingRef.current ||
      submitted ||
      step !== lastStep
    ) {
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

      const newPayload: SubmissionPayload = {
        solicitud_id: crypto.randomUUID(),
        codigo,
        nombre: data.nombre,
        whatsapp: data.whatsapp,
        municipio:
          tipo === "staff" ? "" : data.municipio,
        organizacion:
          tipo === "lider" ? data.organizacion : "",
        equipos:
          tipo === "staff" ? data.equipos : "",
        disponibilidad_completa:
          tipo === "staff"
            ? data.disponibilidadCompleta
            : false,
      };

      try {
        savePendingSubmission(newPayload);
      } catch {
        setError(
          "No pudimos conservar la clave de tu solicitud " +
            "en esta pestaña. No se envió ningún dato. " +
            "Revisa que el almacenamiento del sitio esté permitido.",
        );
        return;
      }

      pendingSubmissionRef.current = newPayload;
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
        try {
          saveReceivedSubmission(codigo);
        } catch {
          console.warn(
            "[registration] No se pudo actualizar " +
              "la confirmación local.",
          );
        }

        setSubmitted(true);
        setRetryLocked(false);
        return;
      }

      const rejectedBeforeInsert = [
        400,
        403,
        404,
        413,
        415,
        422,
      ].includes(response.status);

      if (!result.ok && rejectedBeforeInsert) {
        clearSubmissionSession(codigo);
        pendingSubmissionRef.current = null;
        setRetryLocked(false);
      }

      const message =
        result.error ?? "No fue posible procesar tu solicitud.";

      setError(
        !result.ok && rejectedBeforeInsert
          ? message
          : `${message} Reintenta el envío con el botón; ` +
              "conservaremos la misma solicitud.",
      );
    } catch {
      setError(
        "No pudimos confirmar si tu solicitud fue recibida. " +
          "Pulsa “Reintentar envío”. La clave y los datos " +
          "se conservarán también si recargas esta pestaña.",
      );
    } finally {
      window.clearTimeout(timeoutId);
      sendingRef.current = false;
      setIsSubmitting(false);
    }
  }

  function startNewRegistration() {
    try {
      clearSubmissionSession(codigo);
    } catch {
      setError(
        "No pudimos limpiar la sesión anterior. " +
          "No se inició otra inscripción.",
      );
      return;
    }

    pendingSubmissionRef.current = null;

    setData({
      ...initialRegistrationData,
      area: tipo === "staff" ? "MEDIOS" : "",
    });

    setStep(0);
    setDirection(1);
    setError("");
    setRetryLocked(false);
    setSubmitted(false);
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
          disponibilidadCompleta={
            data.disponibilidadCompleta
          }
          onEquiposChange={(value) =>
            updateField("equipos", value)
          }
          onDisponibilidadChange={updateDisponibilidad}
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

  if (initialSession.failed) {
    return (
      <main className="site-shell">
        <BrandHeader />

        <div className="registration-layout container">
          <section className="form-panel">
            <h2 className="step-heading display-font">
              No pudimos recuperar tu sesión.
            </h2>

            <p className="field-error" role="alert">
              No enviaremos una solicitud nueva para evitar
              duplicar una anterior. Revisa el almacenamiento
              del sitio antes de continuar.
            </p>
          </section>
        </div>
      </main>
    );
  }

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
            <>
              <SuccessStep />

              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}

              <div className="panel-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={startNewRegistration}
                >
                  Inscribir a otra persona
                </button>
              </div>
            </>
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
                canSubmit={true}
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