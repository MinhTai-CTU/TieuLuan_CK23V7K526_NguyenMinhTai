import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/permissions";
import { generateToken } from "@/lib/auth";

// Debug: Check OAuth credentials (only in development)
if (process.env.NODE_ENV === "development") {
  console.log(
    "📢 CHECK GOOGLE ID:",
    process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "📢 CHECK GOOGLE SECRET:",
    process.env.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "📢 CHECK FACEBOOK ID:",
    process.env.FACEBOOK_CLIENT_ID ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "📢 CHECK FACEBOOK SECRET:",
    process.env.FACEBOOK_CLIENT_SECRET ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "📢 CHECK NEXTAUTH_SECRET:",
    process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "📢 CHECK NEXTAUTH_URL:",
    process.env.NEXTAUTH_URL || "❌ Missing"
  );
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "email public_profile", // Request email permission
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("🔵 signIn callback called", {
        email: user.email,
        provider: account?.provider,
        hasAccount: !!account,
        accountType: account?.type,
      });

      if (!user.email) {
        console.error("❌ OAuth signIn: No email provided", {
          provider: account?.provider,
          userId: user.id,
          userName: user.name,
        });
        // Return false to trigger AccessDenied error
        // The error message will be handled in the oauth-callback page
        return false;
      }

      if (!account || !account.provider) {
        console.error("❌ OAuth signIn: No account or provider", {
          hasAccount: !!account,
          provider: account?.provider,
        });
        return false;
      }

      try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        console.log("🔵 Existing user check:", {
          exists: !!existingUser,
          isActive: existingUser?.isActive,
          provider: (existingUser as any)?.provider,
        });

        if (existingUser) {
          // User exists - check if account is active
          if (!existingUser.isActive) {
            console.error("❌ OAuth signIn: User account is banned");
            return false; // Banned user cannot sign in
          }

          // If user exists but doesn't have this provider linked, link it
          const currentProvider = (existingUser as any).provider;
          const currentProviderId = (existingUser as any).providerId;

          if (
            !currentProvider ||
            currentProvider !== account.provider ||
            currentProviderId !== account.providerAccountId
          ) {
            console.log("🔵 Linking provider to existing user");
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                provider: account.provider,
                providerId: account.providerAccountId,
                // Update avatar if provided and user doesn't have one
                avatar: existingUser.avatar || user.image || null,
                // Auto-verify email for OAuth users
                emailVerified: true,
                verifiedAt: new Date(),
              } as any,
            });
          }

          console.log("✅ OAuth signIn: Existing user, allowing sign in");
          return true;
        } else {
          // New user - create account
          console.log("🔵 Creating new user");
          const customerRole = await prisma.role.findUnique({
            where: { name: ROLES.CUSTOMER },
          });

          if (!customerRole) {
            console.error("❌ OAuth signIn: Customer role not found");
            return false;
          }

          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || null,
              provider: account.provider,
              providerId: account.providerAccountId,
              avatar: user.image || null,
              emailVerified: true, // OAuth emails are pre-verified
              verifiedAt: new Date(),
              userRoles: {
                create: {
                  roleId: customerRole.id,
                },
              },
            } as any,
          });

          console.log("✅ OAuth signIn: New user created");
          return true;
        }
      } catch (error) {
        console.error("❌ Error in signIn callback:", error);
        if (error instanceof Error) {
          console.error("❌ Error message:", error.message);
          console.error("❌ Error stack:", error.stack);
        }
        return false;
      }
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        token.userId = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && session.user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        });

        if (dbUser && dbUser.isActive) {
          // Generate JWT token for our system
          const jwtToken = generateToken(dbUser.id, dbUser.email);

          // Add to session
          (session as any).token = jwtToken;
          (session as any).user.id = dbUser.id;
          (session as any).user.roles = dbUser.userRoles.map(
            (ur) => ur.role.name
          );
        }
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("🔵 Redirect callback called", { url, baseUrl });

      // If callbackUrl is our OAuth callback page, allow it
      if (url.includes("/oauth-callback")) {
        console.log("✅ Allowing redirect to OAuth callback page");
        // Ensure it's a full URL
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`;
        }
        return url;
      }

      // If it's a relative URL, make it absolute
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      // If it's same origin, allow it
      try {
        if (new URL(url).origin === baseUrl) {
          return url;
        }
      } catch (e) {
        // Invalid URL, treat as relative
        return `${baseUrl}${url}`;
      }

      // Default: redirect to home
      console.log("🔵 Default redirect to home");
      return baseUrl;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/oauth-callback", // Redirect OAuth errors to oauth-callback page
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
