/**
 * Normalize image URL for production/development
 * In production, convert /uploads/... to /api/uploads/... and /images/... to /api/images/...
 * This ensures images work in both dev and production modes
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return "";

  // If already using API route, return as is
  if (url.startsWith("/api/uploads/") || url.startsWith("/api/images/")) {
    return url;
  }

  // External URLs (http/https) - return as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Data URLs - return as is
  if (url.startsWith("data:")) {
    return url;
  }

  // In production, convert both /uploads/ and /images/ to API routes
  if (process.env.NODE_ENV === "production") {
    if (url.startsWith("/uploads/")) {
      return `/api${url}`;
    }
    // Handle /images/ for seed data
    if (url.startsWith("/images/")) {
      return `/api${url}`;
    }
  }

  // Return as is for development
  return url;
}
