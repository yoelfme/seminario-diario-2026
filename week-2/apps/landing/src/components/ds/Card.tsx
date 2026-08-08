import type { CSSProperties, ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  padding?: CSSProperties["padding"];
  style?: CSSProperties;
}

export function Card({ children, padding = "24px", style }: CardProps) {
  return (
    <div
      style={{
        background: "var(--surface-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-md)",
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
