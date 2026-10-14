type Props = {
  equipos: string;
  onEquiposChange: (value: string) => void;
};

export default function StaffAreaStep({
  equipos,
  onEquiposChange,
}: Props) {
  return (
    <>
      <h2 className="step-heading display-font">
        Equipo de MEDIOS.
      </h2>

      <p className="step-description">
        Gracias por apoyar la cobertura de este encuentro.
        Cuéntanos qué equipos tienes disponibles.
      </p>

      <div className="staff-equipment-field">
        <label htmlFor="staff-equipos">
          ¿Qué equipos tienes disponibles para apoyar?
        </label>

        <textarea
          id="staff-equipos"
          name="equipos"
          value={equipos}
          onChange={(event) =>
            onEquiposChange(event.target.value)
          }
          rows={5}
          maxLength={1000}
          placeholder="Cámara, lentes, trípode, micrófono, computador…"
          aria-describedby="staff-equipos-help"
          required
        />

        <p
          id="staff-equipos-help"
          className="panel-note"
        >
          Si no tienes equipos propios, escribe “No tengo equipos”.
        </p>
      </div>
    </>
  );
}