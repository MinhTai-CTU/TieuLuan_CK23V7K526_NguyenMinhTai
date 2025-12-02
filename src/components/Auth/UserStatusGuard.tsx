import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Server Component to check user status before rendering
 * This runs on the server, so user won't see the page if banned
 */
export default async function UserStatusGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get token from cookie (set by client-side)
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get("auth_token")?.value;

  // If no token, allow access (user is not logged in)
  if (!tokenFromCookie) {
    return <>{children}</>;
  }

  // Verify token
  const decoded = verifyToken(tokenFromCookie);
  if (!decoded) {
    // Invalid token, allow access (will be handled client-side)
    return <>{children}</>;
  }

  // Check user status from database
  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        emailVerified: true,
        bannedAt: true,
        bannedReason: true,
      },
    });

    // User not found or banned - redirect immediately
    if (!user || !user.isActive) {
      redirect("/signin?error=banned");
    }

    // Email not verified - allow but will be checked client-side
    if (!user.emailVerified) {
      return <>{children}</>;
    }

    // User is valid, render children
    return <>{children}</>;
  } catch (error) {
    console.error("UserStatusGuard error:", error);
    // On error, allow access (fail open for better UX)
    return <>{children}</>;
  }
}
