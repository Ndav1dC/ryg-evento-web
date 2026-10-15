import Image from "next/image";
import Link from "next/link";

export default function BrandHeader() {
  return (
    <header className="topbar container">
      <Link
        href="/"
        className="brand"
        aria-label="Reino y Gloria, inicio"
      >
        <Image
          src="/logo-reino-y-gloria.png"
          alt="Reino y Gloria"
          width={92}
          height={58}
          className="brand-logo"
          priority
          style={{ height: "auto" }}
        />

        <span className="brand-caption">
          Inscripciones al evento
        </span>
      </Link>

      <span className="topbar-note">
        Un encuentro que transforma
      </span>
    </header>
  );
}