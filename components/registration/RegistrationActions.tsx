type Props = {
  step: number;
  lastStep: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  retryLocked: boolean;
};

export default function RegistrationActions({
  step,
  lastStep,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting,
  canSubmit,
  retryLocked,
}: Props) {
  return (
    <div className="panel-actions">
      {step < lastStep ? (
        <button
          type="button"
          className="button-primary"
          onClick={onNext}
          disabled={isSubmitting}
        >
          {step === 0
            ? "Comenzar inscripción"
            : "Siguiente →"}
        </button>
      ) : (
        <button
          type="button"
          className="button-primary"
          onClick={onSubmit}
          disabled={isSubmitting || !canSubmit}
          title={
            !canSubmit
              ? "El envío de staff todavía no está habilitado"
              : undefined
          }
        >
          {isSubmitting
            ? "Enviando…"
            : retryLocked
              ? "Reintentar envío"
              : "Enviar inscripción"}
        </button>
      )}

      {step > 0 ? (
        <button
          type="button"
          className="button-secondary"
          onClick={onPrevious}
          disabled={isSubmitting || retryLocked}
        >
          ← Anterior
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}