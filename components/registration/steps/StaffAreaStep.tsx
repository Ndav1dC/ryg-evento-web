type Props = {
  equipos: string;
  disponibilidadCompleta: boolean;
  onEquiposChange: (value: string) => void;
  onDisponibilidadChange: (value: boolean) => void;
};

export default function StaffAreaStep({
  equipos,
  disponibilidadCompleta,
  onEquiposChange,
  onDisponibilidadChange,
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

      <div className="staff-availability">
        <label className="staff-availability__label">
          <input
            type="checkbox"
            name="disponibilidadCompleta"
            checked={disponibilidadCompleta}
            onChange={(event) =>
              onDisponibilidadChange(event.target.checked)
            }
            aria-describedby="staff-disponibilidad-help"
          />

          <span>
            Puedo apoyar desde el primer día hasta el último
            día del evento. (Opcional)
          </span>
        </label>

        <p
          id="staff-disponibilidad-help"
          className="panel-note"
        >
          Marca esta opción si tienes disponibilidad durante
          todo el evento. Puedes enviar tu solicitud sin marcarla.
        </p>
      </div>
    </>
  );
}