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
        Tu inscripción fue recibida.
      </h2>

      <p className="step-description">
        Guardamos tu inscripción correctamente.
        Las indicaciones de ingreso se enviarán
        posteriormente al número de WhatsApp registrado.
      </p>

      <p className="panel-note">
        No necesitas volver a enviar esta inscripción.
        Para registrar a otra persona, utiliza el botón
        de abajo.
      </p>
    </div>
  );
}