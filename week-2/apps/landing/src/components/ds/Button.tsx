"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";

export type ButtonVariant = "primary" | "navy" | "gold" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const sizes: Record<ButtonSize, CSSProperties> = {
  sm: { padding: "8px 16px", fontSize: "var(--fs-body-sm)" },
  md: { padding: "12px 22px", fontSize: "var(--fs-body-md)" },
  lg: { padding: "16px 30px", fontSize: "var(--fs-body-lg)" },
};

const variants: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: "var(--brand-secondary)",
    color: "#fff",
    border: "2px solid var(--brand-secondary)",
  },
  navy: {
    background: "var(--brand-primary)",
    color: "#fff",
    border: "2px solid var(--brand-primary)",
  },
  gold: {
    background: "var(--brand-accent)",
    color: "var(--navy-900)",
    border: "2px solid var(--brand-accent)",
  },
  outline: {
    background: "transparent",
    color: "var(--brand-primary)",
    border: "2px solid var(--brand-primary)",
  },
  ghost: {
    background: "transparent",
    color: "var(--brand-primary)",
    border: "2px solid transparent",
  },
};

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  icon = null,
  onClick,
  style,
}: ButtonProps) {
  const v = variants[variant];
  const s = sizes[size];
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: "var(--fw-semibold)" as CSSProperties["fontWeight"],
        borderRadius: "var(--radius-pill)",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition:
          "transform var(--duration-fast) var(--ease-standard),filter var(--duration-fast) var(--ease-standard)",
        opacity: disabled ? 0.5 : 1,
        ...s,
        ...v,
        ...style,
      }}
      onMouseOver={(e: MouseEvent<HTMLButtonElement>) => {
        if (!disabled) e.currentTarget.style.filter = "brightness(1.08)";
      }}
      onMouseOut={(e: MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.filter = "none";
      }}
      onMouseDown={(e: MouseEvent<HTMLButtonElement>) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.97)";
      }}
      onMouseUp={(e: MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {icon}
      {children}
    </button>
  );
}
