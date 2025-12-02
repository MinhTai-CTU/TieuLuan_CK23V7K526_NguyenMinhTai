/**
 * Utility functions for managing authentication tokens and user data in localStorage
 */

const AUTH_TOKEN_KEY = "auth_token";
const USER_KEY = "user";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar?: string | null;
  dateOfBirth?: string | null; // ISO date string or null
  emailVerified?: boolean;
  isActive?: boolean;
  roles: string[];
}

/**
 * Save authentication token to localStorage and cookie
 */
export function saveToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    // Also save to cookie for server-side access
    document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  }
}

/**
 * Get authentication token from localStorage
 */
export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

/**
 * Remove authentication token from localStorage and cookie
 */
export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    // Also remove cookie
    document.cookie = `auth_token=; path=/; max-age=0; SameSite=Lax`;
  }
}

/**
 * Save user data to localStorage
 */
export function saveUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

/**
 * Get user data from localStorage
 */
export function getUser(): User | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    }
  }
  return null;
}

/**
 * Remove user data from localStorage
 */
export function removeUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_KEY);
  }
}

/**
 * Clear all authentication data
 */
export function clearAuth(): void {
  removeToken();
  removeUser();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Get authorization header value
 */
export function getAuthHeader(): string | null {
  const token = getToken();
  return token ? `Bearer ${token}` : null;
}
