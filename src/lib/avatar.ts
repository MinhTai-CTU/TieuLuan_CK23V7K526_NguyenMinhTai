/**
 * Avatar utility functions
 */

/**
 * Generate avatar URL from initial letter
 * Uses UI Avatars service to generate avatar from text
 */
export function generateAvatarFromInitial(name: string | null): string {
  if (!name || name.trim().length === 0) {
    return generateAvatarFromInitial("U"); // Default to "U" for User
  }

  const initial = name.trim().charAt(0).toUpperCase();
  const backgroundColor = getColorFromInitial(initial);
  const textColor = "#FFFFFF";

  // Using UI Avatars service
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initial
  )}&background=${backgroundColor}&color=${textColor}&size=128&bold=true&font-size=0.5`;
}

/**
 * Get a consistent color for an initial letter
 * Uses a simple hash function to map letters to colors
 */
function getColorFromInitial(initial: string): string {
  const colors = [
    "3C50E0", // Blue
    "22AD5C", // Green
    "F23030", // Red
    "FBBF24", // Yellow
    "02AAA4", // Teal
    "F27430", // Orange
    "8B5CF6", // Purple
    "EC4899", // Pink
    "06B6D4", // Cyan
    "84CC16", // Lime
  ];

  // Simple hash function to get consistent color for same letter
  const charCode = initial.charCodeAt(0);
  const index = charCode % colors.length;
  return colors[index];
}

/**
 * Validate if URL is a valid image URL
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validDomains = [
      "ui-avatars.com",
      "lh3.googleusercontent.com",
      "platform-lookaside.fbsbx.com",
      "graph.facebook.com",
    ];
    return validDomains.some((domain) => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Get avatar URL - handles all three cases:
 * 1. Generated from initial (UI Avatars)
 * 2. OAuth provider URL
 * 3. Uploaded file URL
 */
export function getAvatarUrl(
  avatar: string | null | undefined,
  name: string | null
): string {
  // If avatar exists and is a valid URL, use it
  if (avatar && (avatar.startsWith("http") || avatar.startsWith("/"))) {
    return avatar;
  }

  // Otherwise, generate from initial
  return generateAvatarFromInitial(name);
}
