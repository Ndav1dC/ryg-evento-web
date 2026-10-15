import { useMunicipalities } from "@/components/registration/MunicipalityProvider";

import type {
  RegistrationFormData,
  RegistrationType,
} from "@/types/registration";

type Props = {
  tipo: RegistrationType;
  data: RegistrationFormData;
};

export default function ReviewStep({
  tipo,
  data,
}: Props) {
  const municipalities = useMunicipalities();

  const isStaff = tipo === "staff";
  const isLeader = tipo === "lider";

  const municipality = municipalities.find(
    (item) => item.codigo === data.municipio,
  );

  const municipalityLabel = municipality
    ? `${municipality.nombre} — ${municipality.departamento_nombre}`
    : "Municipio no seleccionado";

  return (
    <>
      <h2 className="step-heading display-font">
        Revisa tus datos.
      </h2>

      <p className="step-description">
        Comprueba que la información sea correcta antes de continuar.
      </p>

      <div className="review-box">
        <div className="review-row">
          <span>Nombre completo</span>
          <strong>{data.nombre.trim()}</strong>
        </div>

        <div className="review-row">
          <span>WhatsApp</span>
          <strong>{data.whatsapp.trim()}</strong>
        </div>

        <div className="review-row">
          <span>{isStaff ? "Área de apoyo" : "Procedencia"}</span>
          <strong>
            {isStaff ? data.area : municipalityLabel}
          </strong>
        </div>

        {isLeader && (
          <div className="review-row">
            <span>Iglesia u organización</span>
            <strong>{data.organizacion.trim()}</strong>
          </div>
        )}
      </div>

      <p className="panel-note">
        {isStaff
          ? "El envío de staff todavía no está habilitado."
          : "Al enviar, registraremos tu solicitud para revisión. " +
            "Esto no representa una aprobación ni una reserva de cupo."}
      </p>
    </>
  );
}