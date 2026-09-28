import { notFound } from "next/navigation";
import RegistrationFlow from "@/components/registration/RegistrationFlow";
import { getRegistrationTypeByCode } from "@/lib/registration/access";

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

  return <RegistrationFlow tipo={tipo} />;
}