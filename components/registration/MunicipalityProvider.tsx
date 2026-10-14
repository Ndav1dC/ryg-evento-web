"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import type { Municipality } from "@/types/municipality";

const MunicipalityContext = createContext<Municipality[] | null>(null);

type Props = {
  municipalities: Municipality[];
  children: ReactNode;
};

export default function MunicipalityProvider({
  municipalities,
  children,
}: Props) {
  return (
    <MunicipalityContext.Provider value={municipalities}>
      {children}
    </MunicipalityContext.Provider>
  );
}

export function useMunicipalities(): Municipality[] {
  const context = useContext(MunicipalityContext);

  if (context === null) {
    throw new Error(
      "useMunicipalities debe utilizarse dentro de MunicipalityProvider.",
    );
  }

  return context;
}