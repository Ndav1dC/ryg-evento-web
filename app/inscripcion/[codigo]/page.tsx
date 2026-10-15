import { notFound } from "next/navigation";

import RegistrationFlow from "@/components/registration/RegistrationFlow";
import MunicipalityProvider from "@/components/registration/MunicipalityProvider";

import { getRegistrationTypeByCode } from "@/lib/registration/access";
import { getMunicipalities } from "@/lib/registration/municipalities";

export const dynamic = "force-dynamic";

export default async function RegistrationPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const tipo = getRegistrationTypeByCode(codigo);

  if (!tipo) {
    notFound();
  }

  const municipalities =
    tipo === "staff" ? [] : await getMunicipalities();

  return (
    <MunicipalityProvider municipalities={municipalities}>
      <RegistrationFlow
        key={codigo}
        tipo={tipo}
        codigo={codigo}
      />
    </MunicipalityProvider>
  );
}