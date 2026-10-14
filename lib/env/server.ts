import "server-only";

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Falta configurar la variable de entorno: ${name}`,
    );
  }

  return value;
}

export function getSupabaseServerConfig() {
  return {
    url: requireEnvironmentVariable("SUPABASE_URL"),
    secretKey: requireEnvironmentVariable("SUPABASE_SECRET_KEY"),
  };
}

export function getConfiguredEventId(): string {
  return requireEnvironmentVariable("EVENTO_ID");
}