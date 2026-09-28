import MunicipalityCombobox from "@/components/registration/fields/MunicipalityCombobox";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function MunicipalityStep({
  value,
  onChange,
}: Props) {
  return (
    <>
      <h2 className="step-heading display-font">
        ¿De qué municipio o ciudad vienes?
      </h2>

      <p className="step-description">
        Busca tu municipio y selecciónalo en la lista.
      </p>

      <div className="form-fields">
        <MunicipalityCombobox
          value={value}
          onChange={onChange}
        />
      </div>
    </>
  );
}