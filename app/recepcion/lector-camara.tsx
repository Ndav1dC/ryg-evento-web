"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type LectorCamaraProps = {
  onDetectado: (codigo: string) => void;
};

export function LectorCamara({
  onDetectado,
}: LectorCamaraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState(
    "Preparando la cámara...",
  );

  useEffect(() => {
    const video = videoRef.current;

    let cancelado = false;
    let finalizado = false;
    let stream: MediaStream | null = null;
    let temporizador:
      ReturnType<typeof setTimeout> | undefined;

    const canvas = document.createElement("canvas");
    const contexto = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    function detener() {
      finalizado = true;

      if (temporizador) {
        clearTimeout(temporizador);
      }

      stream?.getTracks().forEach((track) => {
        track.stop();
      });

      if (video) {
        video.srcObject = null;
      }
    }

    function leerFotograma() {
      if (
        cancelado ||
        finalizado ||
        !video ||
        !contexto
      ) {
        return;
      }

      try {
        if (
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          const escala = Math.min(
            1,
            720 / video.videoWidth,
          );

          canvas.width = Math.max(
            1,
            Math.round(video.videoWidth * escala),
          );

          canvas.height = Math.max(
            1,
            Math.round(video.videoHeight * escala),
          );

          contexto.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height,
          );

          const imagen = contexto.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );

          const lectura = jsQR(
            imagen.data,
            imagen.width,
            imagen.height,
            {
              inversionAttempts: "dontInvert",
            },
          );

          if (lectura) {
            const codigo = lectura.data.trim();

            if (/^RYG1\.[0-9a-f]{64}$/.test(codigo)) {
              detener();

              if (!cancelado) {
                onDetectado(codigo);
              }

              return;
            }

            setAviso(
              "El QR detectado no es una invitación de este sistema.",
            );
          }
        }

        temporizador = setTimeout(
          leerFotograma,
          180,
        );
      } catch {
        detener();

        if (!cancelado) {
          setError(
            "No fue posible leer la cámara. Ciérrala y vuelve a intentarlo.",
          );
        }
      }
    }

    async function iniciar() {
      try {
        if (
          !window.isSecureContext ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw new Error("CONTEXTO_NO_SEGURO");
        }

        if (!video || !contexto) {
          throw new Error("VIDEO_NO_DISPONIBLE");
        }

        stream =
          await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: {
                ideal: "environment",
              },
              width: {
                ideal: 1280,
              },
              height: {
                ideal: 720,
              },
            },
          });

        if (cancelado || finalizado) {
          detener();
          return;
        }

        video.srcObject = stream;
        await video.play();

        if (cancelado || finalizado) {
          detener();
          return;
        }

        setAviso(
          "Apunta al QR y mantén el teléfono estable.",
        );

        leerFotograma();
      } catch (causa: unknown) {
        detener();

        if (cancelado) {
          return;
        }

        const nombre =
          causa instanceof Error ? causa.name : "";

        const mensaje =
          causa instanceof Error ? causa.message : "";

        if (mensaje === "CONTEXTO_NO_SEGURO") {
          setError(
            "Abre esta página mediante HTTPS para utilizar la cámara.",
          );
        } else if (nombre === "NotAllowedError") {
          setError(
            "No se permitió el acceso a la cámara. Revisa los permisos del sitio en tu navegador.",
          );
        } else if (nombre === "NotFoundError") {
          setError(
            "No se encontró una cámara disponible.",
          );
        } else if (nombre === "NotReadableError") {
          setError(
            "La cámara está ocupada o no puede iniciarse. Cierra otras aplicaciones que la utilicen.",
          );
        } else {
          setError(
            "No fue posible iniciar la cámara. Puedes utilizar el campo manual.",
          );
        }
      }
    }

    function alOcultar() {
      if (document.hidden) {
        detener();

        if (!cancelado) {
          setError(
            "La cámara se detuvo al salir de la pestaña. Cierra el lector y actívalo nuevamente.",
          );
        }
      }
    }

    document.addEventListener(
      "visibilitychange",
      alOcultar,
    );

    void iniciar();

    return () => {
      cancelado = true;
      detener();

      document.removeEventListener(
        "visibilitychange",
        alOcultar,
      );
    };
  }, [onDetectado]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E4D3A1] bg-white">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        aria-label="Vista de cámara para leer invitaciones"
        className="aspect-[4/3] w-full bg-black object-contain"
      />

      <p
        role="status"
        className={`px-4 py-3 text-sm leading-6 ${
          error
            ? "bg-red-50 text-red-700"
            : "bg-[#FBF6E8] text-[#765410]"
        }`}
      >
        {error || aviso}
      </p>
    </div>
  );
}