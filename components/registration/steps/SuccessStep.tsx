"use client";

import { useEffect, useRef } from "react";

export default function SuccessStep() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div role="status">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="step-heading display-font"
      >
        Recibimos tu solicitud.
      </h2>

      <p className="step-description">
        Tu solicitud fue recibida correctamente.
        El equipo del evento revisará la información.
      </p>

      <p className="panel-note">
        Este mensaje no representa una aprobación ni una
        reserva de cupo. No necesitas volver a enviar
        esta solicitud.
      </p>
    </div>
  );
}