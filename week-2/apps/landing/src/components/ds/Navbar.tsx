"use client";

import Image from "next/image";

import { scrollToId } from "../../lib/scroll";
import { Button } from "./Button";

export interface NavItem {
  label: string;
  href: string;
}

export interface NavbarProps {
  items: NavItem[];
  ctaLabel: string;
  ctaTargetId: string;
}

export function Navbar({ items, ctaLabel, ctaTargetId }: NavbarProps) {
  return (
    <nav
      style={{
        fontFamily: "var(--font-body)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
        padding: "14px 32px",
        background: "var(--surface-page)",
        borderBottom: "1px solid var(--border-subtle)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Image
          src="/logo.png"
          alt="Colegio El Bosque"
          width={44}
          height={44}
          style={{ height: 44, width: "auto" }}
          priority
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 28 }}>
        {items.map((it) => (
          <a
            key={it.href}
            href={it.href}
            style={{
              color: "var(--text-body)",
              textDecoration: "none",
              fontWeight: "var(--fw-semibold)",
              fontSize: "var(--fs-body-md)",
            }}
          >
            {it.label}
          </a>
        ))}
      </div>
      <Button size="sm" onClick={() => scrollToId(ctaTargetId)}>
        {ctaLabel}
      </Button>
    </nav>
  );
}
