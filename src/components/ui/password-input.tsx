"use client";

import React, { useState } from "react";
import { Input, InputProps } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => setIsVisible(!isVisible);

    return (
      <Input
        {...props}
        ref={ref}
        type={isVisible ? "text" : "password"}
        endContent={
          <button
            className="focus:outline-none"
            type="button"
            onClick={toggleVisibility}
            aria-label="toggle password visibility"
          >
            {isVisible ? (
              <EyeOff className="w-5 h-5 text-default-400 pointer-events-none" />
            ) : (
              <Eye className="w-5 h-5 text-default-400 pointer-events-none" />
            )}
          </button>
        }
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";
