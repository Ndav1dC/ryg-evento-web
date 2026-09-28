import type {
  RegistrationField,
  RegistrationFormData,
} from "@/types/registration";

type Props = {
  data: RegistrationFormData;
  onChange: (
    field: RegistrationField,
    value: string,
  ) => void;
};

export default function PersonalDataStep({
  data,
  onChange,
}: Props) {
  return (
    <>
      <h2 className="step-heading display-font">
        Comencemos con tus datos.
      </h2>

      <p className="step-description">
        Así podremos identificarte y contactarte.
      </p>

      <div className="form-fields">
        <div>
          <label className="field-label" htmlFor="nombre">
            Nombre completo
          </label>

          <input
            id="nombre"
            className="field-input"
            autoComplete="name"
            placeholder="Escribe tu nombre y apellido"
            value={data.nombre}
            onChange={(event) =>
              onChange("nombre", event.target.value)
            }
          />
        </div>

        <div>
          <label className="field-label" htmlFor="whatsapp">
            Número de WhatsApp
          </label>

          <input
            id="whatsapp"
            className="field-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Ej. 300 123 4567"
            value={data.whatsapp}
            onChange={(event) =>
              onChange("whatsapp", event.target.value)
            }
          />
        </div>
      </div>
    </>
  );
}