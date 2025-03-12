import React, { useState } from "react";
import { ToggleSwitch } from "./toggle-switch";


interface ToggleGroupProps {
  name: string;
  options: string[];
  setFieldValue: (field: string, value: any) => void;
}

export function ToggleSwitchGroup({
  name,
  options,
  setFieldValue,
}: ToggleGroupProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const handleToggle = (option: string) => {
    setSelectedOptions((prevState) => {
      const newState = prevState.includes(option)
        ? prevState.filter((item) => item !== option)
        : [...prevState, option];
      setFieldValue(name, newState);
      return newState;
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{name}</label>
      {options.map((option) => (
        <div className="flex items-center gap-2" key={option}>
          <ToggleSwitch
            isOn={selectedOptions.includes(option)}
            onToggle={() => handleToggle(option)}
          />
          <span className="text-sm font-normal">{option}</span>
        </div>
      ))}
    </div>
  );
}
