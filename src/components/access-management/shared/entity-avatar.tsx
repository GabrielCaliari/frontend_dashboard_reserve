"use client";

interface EntityAvatarProps {
 name: string;
 size?:"sm" |"md" |"lg";
 className?: string;
}

const AVATAR_COLORS = ["bg-blue-500","bg-purple-500","bg-green-500","bg-orange-500","bg-pink-500","bg-teal-500","bg-indigo-500","bg-red-500",
];

function getColorFromName(name: string): string {
 let hash = 0;
 for (let i = 0; i < name.length; i++) {
 hash = name.charCodeAt(i) + ((hash << 5) - hash);
 }
 return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
 return name
 .split("")
 .map((word) => word[0])
 .filter(Boolean)
 .slice(0, 2)
 .join("")
 .toUpperCase();
}

const SIZE_CLASSES = { sm:"w-8 h-8 text-xs", md:"w-10 h-10 text-sm", lg:"w-14 h-14 text-lg" };

export function EntityAvatar({ name, size ="md", className ="" }: EntityAvatarProps) {
 const color = getColorFromName(name ||"?");
 const initials = getInitials(name ||"?");
 const sizeClass = SIZE_CLASSES[size];

 return (
 <div className={`${color} ${sizeClass} ${className} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}>
 {initials}
 </div>
 );
}
