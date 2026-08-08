import type { CSSProperties } from "react";

export interface ImageSlotProps {
  shape?: "circle" | "rounded" | "rect";
  placeholder?: string;
  style?: CSSProperties;
}

/**
 * Neutral image placeholder, standing in for the user-fillable <image-slot>
 * from the original design. Fills its container.
 */
export function ImageSlot({
  shape = "rounded",
  placeholder = "",
  style,
}: ImageSlotProps) {
  const borderRadius =
    shape === "circle" ? "50%" : shape === "rect" ? "0px" : "var(--radius-md)";
  return (
    <div
      role="img"
      aria-label={placeholder || "Imagen"}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg,var(--gray-100),var(--gray-300))",
        color: "var(--gray-700)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--fs-caption)",
        fontWeight: 700,
        textAlign: "center",
        padding: "8px",
        overflow: "hidden",
        borderRadius,
        ...style,
      }}
    >
      {placeholder}
    </div>
  );
}
