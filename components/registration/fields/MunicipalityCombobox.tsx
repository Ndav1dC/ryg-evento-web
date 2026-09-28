"use client";

import { useState } from "react";
import {
  municipalities,
  normalizeSearchText,
} from "@/lib/registration/municipalities";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function MunicipalityCombobox({
  value,
  onChange,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const results = municipalities
    .filter((item) =>
      normalizeSearchText(item).includes(
        normalizeSearchText(value.trim()),
      ),
    )
    .slice(0, 7);

  return (
    <div className="combobox">
      <label className="field-label" htmlFor="municipio">
        Municipio o ciudad de procedencia
      </label>

      <input
        id="municipio"
        className="field-input"
        role="combobox"
        aria-expanded={isOpen && results.length > 0}
        aria-controls="municipality-options"
        autoComplete="off"
        placeholder="Buscar municipio o ciudad..."
        value={value}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => setIsOpen(false), 150);
        }}
      />

      {isOpen && results.length > 0 && (
        <div
          id="municipality-options"
          className="combobox-list"
          role="listbox"
        >
          {results.map((item) => {
            const [city, department] = item.split(" — ");

            return (
              <button
                type="button"
                role="option"
                aria-selected={value === item}
                className="combobox-option"
                key={item}
                onMouseDown={(event) =>
                  event.preventDefault()
                }
                onClick={() => {
                  onChange(item);
                  setIsOpen(false);
                }}
              >
                {city} <span>— {department}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}