import React from "react";

interface ToggleSwitchProps {
  isOn: boolean;
  onToggle: () => void;
}

export function ToggleSwitch({ isOn, onToggle }: ToggleSwitchProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isOn}
          onChange={onToggle}
          className="sr-only peer"
        />
        <div className="w-10 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-4 peer-checked:after:bg-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
      </label>
    </div>
  );
}

