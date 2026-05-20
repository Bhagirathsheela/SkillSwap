import React, { useState } from "react";

/**
 * Avatar — circular user badge.
 *
 * Priority:
 *   1. imageUrl (if provided AND loads successfully)
 *   2. Initials from name  ("Bhagirath Sheela" → BS, "Bhagirath" → B)
 *   3. Initials from email local-part ("bhagirath001@x.com" → B)
 *   4. "?" placeholder
 *
 * Background colour is hashed deterministically from the name/email so the
 * same user always gets the same colour across sessions.
 */

// 8-colour palette tuned to harmonise with the SkillSwap purple brand.
const PALETTE = [
  { bg: "#6366f1", fg: "#ffffff" }, // indigo
  { bg: "#10b981", fg: "#ffffff" }, // emerald
  { bg: "#f59e0b", fg: "#1f2937" }, // amber
  { bg: "#f43f5e", fg: "#ffffff" }, // rose
  { bg: "#0ea5e9", fg: "#ffffff" }, // sky
  { bg: "#8b5cf6", fg: "#ffffff" }, // violet
  { bg: "#14b8a6", fg: "#ffffff" }, // teal
  { bg: "#d946ef", fg: "#ffffff" }, // fuchsia
];

const hashString = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0; // force 32-bit
  }
  return Math.abs(h);
};

const getInitials = (name, email) => {
  const src = (name || "").trim();
  if (src) {
    const words = src.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      // First letter of first word + first letter of LAST word (skip middles).
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return words[0][0].toUpperCase();
  }
  const e = (email || "").trim();
  if (e) {
    const local = e.split("@")[0];
    if (local) return local[0].toUpperCase();
  }
  return "?";
};

const getColors = (key) => PALETTE[hashString(key || "?") % PALETTE.length];

// Size presets → Tailwind class strings.
const SIZE_CLASSES = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

export default function Avatar({
  name,
  email,
  imageUrl,
  size = "md",
  className = "",
  title,
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showInitials = !imageUrl || imgFailed;
  const sizeCls = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const displayLabel = name || email || "User";

  if (showInitials) {
    const initials = getInitials(name, email);
    const colorKey = (name || email || "?").toLowerCase();
    const { bg, fg } = getColors(colorKey);
    return (
      <div
        className={`${sizeCls} rounded-full inline-flex items-center justify-center font-semibold select-none flex-shrink-0 ${className}`}
        style={{ backgroundColor: bg, color: fg }}
        title={title || displayLabel}
        aria-label={displayLabel}
        role="img"
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={displayLabel}
      title={title || displayLabel}
      onError={() => setImgFailed(true)}
      className={`${sizeCls} rounded-full object-cover flex-shrink-0 ${className}`}
    />
  );
}
