type Props = {
  step: number;
  lastStep: number;
};

export default function RegistrationProgress({
  step,
  lastStep,
}: Props) {
  const percentage =
    lastStep === 0 ? 0 : (step / lastStep) * 100;

  return (
    <>
      <div className="panel-top">
        <span className="panel-kicker">
          {step === 0 ? "Bienvenido" : "Tu inscripción"}
        </span>

        <span className="step-count">
          {step === 0
            ? "Comencemos"
            : `Paso ${step} de ${lastStep}`}
        </span>
      </div>

      <div
        className="progress-track"
        role="progressbar"
        aria-label="Progreso de inscripción"
        aria-valuemin={0}
        aria-valuemax={lastStep}
        aria-valuenow={step}
      >
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </>
  );
}