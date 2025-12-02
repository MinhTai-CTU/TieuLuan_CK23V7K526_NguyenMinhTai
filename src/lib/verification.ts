import { randomBytes } from "crypto";

/**
 * Generate a secure random token for email verification
 */
export function generateVerificationToken(): string {
  // Generate 32 random bytes and convert to hex string
  return randomBytes(32).toString("hex");
}

/**
 * Check if verification token is expired (24 hours)
 */
export function isTokenExpired(createdAt: Date): boolean {
  const now = new Date();
  const tokenAge = now.getTime() - createdAt.getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  return tokenAge > twentyFourHours;
}
