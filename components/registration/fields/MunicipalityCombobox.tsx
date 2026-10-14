"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { useMunicipalities } from "@/components/registration/MunicipalityProvider";

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function MunicipalityCombobox({
  value,
  onChange,
}: Props) {
  const municipalities = useMunicipalities();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = municipalities.find(
    (municipality) => municipality.codigo === value,
  );

  const selectedLabel = selected
    ? `${selected.nombre} — ${selected.departamento_nombre}`
    : "";

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputValue = selected ? selectedLabel : query;

  const searchText = normalize(query.trim());

  const results = municipalities
    .filter((municipality) => {
      const label = normalize(
        `${municipality.nombre} ${municipality.departamento_nombre}`,
      );

      return label.includes(searchText);
    })
    .slice(0, 20);

  useEffect(() => {
    function handleOutsideClick(event: PointerEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, []);

  function selectMunicipality(code: string) {
    onChange(code);
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        Math.min(current + 1, results.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        current < 0
          ? results.length - 1
          : Math.max(current - 1, 0),
      );
      return;
    }

    if (
      event.key === "Enter" &&
      isOpen &&
      activeIndex >= 0 &&
      results[activeIndex]
    ) {
      event.preventDefault();
      selectMunicipality(results[activeIndex].codigo);
    }
  }

  return (
    <div
      ref={rootRef}
      className="combobox"
      onBlur={(event) => {
        if (
          !event.currentTarget.contains(
            event.relatedTarget as Node | null,
          )
        ) {
          setIsOpen(false);
          setActiveIndex(-1);
        }
      }}
    >
      <label className="field-label" htmlFor="municipio">
        Municipio o ciudad de procedencia
      </label>

      <input
        id="municipio"
        className="field-input"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={
          isOpen && activeIndex >= 0
            ? `${listId}-${activeIndex}`
            : undefined
        }
        autoComplete="off"
        placeholder="Buscar municipio o departamento..."
        value={inputValue}
        onFocus={() => {
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange("");
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
      />

      {isOpen && (
        <div
          id={listId}
          className="combobox-list"
          role="listbox"
          aria-label="Municipios disponibles"
        >
          {results.length === 0 ? (
            <p className="municipality-empty">
              No encontramos resultados. Prueba con otro nombre.
            </p>
          ) : (
            results.map((municipality, index) => (
              <div
                id={`${listId}-${index}`}
                key={municipality.codigo}
                role="option"
                aria-selected={value === municipality.codigo}
                className={`combobox-option ${
                  index === activeIndex
                    ? "combobox-option--active"
                    : ""
                }`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  selectMunicipality(municipality.codigo);
                }}
              >
                {municipality.nombre}
                <span> — {municipality.departamento_nombre}</span>
              </div>
            ))
          )}
        </div>
      )}

      <p className="municipality-help">
        Selecciona una opción de la lista.
      </p>
    </div>
  );
}