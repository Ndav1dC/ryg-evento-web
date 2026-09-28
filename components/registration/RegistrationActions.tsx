type Props = {
  step: number;
  lastStep: number;
  onPrevious: () => void;
  onNext: () => void;
};

export default function RegistrationActions({
  step,
  lastStep,
  onPrevious,
  onNext,
}: Props) {
  return (
    <div className="panel-actions">
      {step < lastStep ? (
        <button
          type="button"
          className="button-primary"
          onClick={onNext}
        >
          {step === 0
            ? "Comenzar inscripción"
            : "Siguiente →"}
        </button>
      ) : (
        <button
          type="button"
          className="button-primary"
          disabled
          title="Disponible al conectar Supabase"
        >
          Enviar inscripción
        </button>
      )}

      {step > 0 ? (
        <button
          type="button"
          className="button-secondary"
          onClick={onPrevious}
        >
          ← Anterior
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}