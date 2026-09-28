type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function OrganizationStep({
  value,
  onChange,
}: Props) {
  return (
    <>
      <h2 className="step-heading display-font">
        Cuéntanos de tu comunidad.
      </h2>

      <p className="step-description">
        ¿De qué iglesia u organización vienes?
      </p>

      <div className="form-fields">
        <div>
          <label
            className="field-label"
            htmlFor="organizacion"
          >
            Iglesia u organización de procedencia
          </label>

          <input
            id="organizacion"
            className="field-input"
            placeholder="Escribe el nombre de tu iglesia u organización"
            value={value}
            onChange={(event) =>
              onChange(event.target.value)
            }
          />
        </div>
      </div>
    </>
  );
}