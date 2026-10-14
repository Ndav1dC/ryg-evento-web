import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Municipality } from "@/types/municipality";

export async function getMunicipalities(): Promise<Municipality[]> {
  const supabase = createAdminClient();

  const pageSize = 500;
  const municipalities: Municipality[] = [];
  let start = 0;

  while (true) {
    const { data, error } = await supabase
      .from("municipios")
      .select(
        "codigo, nombre, departamento_codigo, departamento_nombre",
      )
      .order("codigo", { ascending: true })
      .range(start, start + pageSize - 1);

    if (error) {
      console.error("[getMunicipalities]", {
        code: error.code,
        message: error.message,
      });

      throw new Error("No fue posible cargar el catálogo de municipios.");
    }

    if (!data || data.length === 0) {
      break;
    }

    municipalities.push(...data);
    start += data.length;
  }

  if (municipalities.length === 0) {
    throw new Error("El catálogo de municipios está vacío.");
  }

  return municipalities.sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es"),
  );
}