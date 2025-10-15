"use client";

import { useState } from "react";

function getColorFromName(name: string): string {
  // Generate consistent color based on name
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
  ];

  const hash = name.split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  return colors[hash % colors.length];
}

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number; // default 40px
}

export function Avatar({ src, name, size = 40 }: AvatarProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    // Fallback: show first letter in colored circle
    const initial = name.charAt(0).toUpperCase();
    const bgColor = getColorFromName(name);

    return (
      <div
        className="flex items-center justify-center text-white font-bold"
        style={{
          width: size,
          height: size,
          backgroundColor: bgColor,
          borderRadius: "50%",
          fontSize: size / 2,
        }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-cover"
      onError={() => setError(true)}
    />
  );
}
