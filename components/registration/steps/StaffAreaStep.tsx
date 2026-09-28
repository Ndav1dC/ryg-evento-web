import { staffAreas } from "@/lib/registration/config";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function StaffAreaStep({
  value,
  onChange,
}: Props) {
  return (
    <>
      <h2 className="step-heading display-font">
        ¿En qué área apoyarás?
      </h2>

      <p className="step-description">
        Selecciona el equipo en el que participarás.
      </p>

      <div className="area-options">
        {staffAreas.map((area) => (
          <button
            type="button"
            key={area}
            className={`area-option ${
              value === area ? "selected" : ""
            }`}
            aria-pressed={value === area}
            onClick={() => onChange(area)}
          >
            {area}
          </button>
        ))}
      </div>
    </>
  );
}