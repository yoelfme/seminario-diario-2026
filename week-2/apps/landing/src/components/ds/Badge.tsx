import type { CSSProperties, ReactNode } from "react";

export type BadgeKind = "gold" | "green" | "navy" | "silver" | "bronze";

const kinds: Record<BadgeKind, CSSProperties> = {
  gold: {
    background: "var(--gold-100)",
    color: "var(--gold-700)",
    border: "1px solid var(--gold-500)",
  },
  green: {
    background: "#E7F5E8",
    color: "var(--green-800)",
    border: "1px solid var(--green-600)",
  },
  navy: {
    background: "#E7EDF8",
    color: "var(--navy-800)",
    border: "1px solid var(--navy-500)",
  },
  silver: {
    background: "#F1F3F6",
    color: "#5B6472",
    border: "1px solid var(--silver-500)",
  },
  bronze: {
    background: "#F6EBE1",
    color: "#7A4A24",
    border: "1px solid var(--bronze-500)",
  },
};

export interface BadgeProps {
  children: ReactNode;
  kind?: BadgeKind;
  icon?: ReactNode;
}

export function Badge({ children, kind = "navy", icon = null }: BadgeProps) {
  return (
    <span
      style={{
        fontFamily: "var(--font-body)",
        fontWeight: "var(--fw-bold)" as CSSProperties["fontWeight"],
        fontSize: "var(--fs-caption)",
        letterSpacing: ".02em",
        textTransform: "uppercase",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 12px",
        borderRadius: "var(--radius-pill)",
        ...kinds[kind],
      }}
    >
      {icon}
      {children}
    </span>
  );
}
