import * as React from "react";

interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function Switch({
  id,
  checked,
  onCheckedChange,
  className,
}: SwitchProps) {
  return (
    <label
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        cursor: "pointer",
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        style={{ display: "none" }}
      />
      <span
        style={{
          width: 40,
          height: 20,
          background: checked ? "#4f46e5" : "#ccc",
          borderRadius: 20,
          position: "relative",
          transition: "background 0.2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: checked ? 20 : 0,
            top: 0,
            width: 20,
            height: 20,
            background: "#fff",
            borderRadius: "50%",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "left 0.2s",
          }}
        />
      </span>
    </label>
  );
}
