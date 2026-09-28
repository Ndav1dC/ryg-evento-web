import type { RegistrationType } from "@/types/registration";

export function getRegistrationTypeByCode(
  codigo: string,
): RegistrationType | null {
  const registrations: Array<{
    code: string | undefined;
    type: RegistrationType;
  }> = [
    {
      code: process.env.REGISTRATION_CODE_ASISTENTE,
      type: "asistente",
    },
    {
      code: process.env.REGISTRATION_CODE_LIDER,
      type: "lider",
    },
    {
      code: process.env.REGISTRATION_CODE_STAFF,
      type: "staff",
    },
  ];

  const match = registrations.find(
    (registration) =>
      registration.code &&
      registration.code === codigo,
  );

  return match?.type ?? null;
}