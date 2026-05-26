"use client"
import { Input } from"@/src/components/ui/input"

interface ColorPickerProps {
 color: string | undefined
 onChange: (color: string) => void
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
 return (
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded border" style={{ backgroundColor: color }} />
 <Input
 type="color"
 value={color}
 onChange={(e) => onChange(e.target.value)}
 className="w-12 h-8 p-0 overflow-hidden"
 />
 <Input type="text" value={color} onChange={(e) => onChange(e.target.value)} className="flex-1" />
 </div>
 )
}
