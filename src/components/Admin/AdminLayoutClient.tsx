"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, saveUser } from "@/lib/auth-storage";
import { QueryProvider } from "@/app/providers/query-provider";
import AdminSidebar from "@/components/Admin/Sidebar";
import AdminHeader from "@/components/Admin/Header";
import AdminChatButton from "@/components/Admin/AdminChatButton";

interface User {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  roles: string[];
}

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      const localUser = getUser();

      console.log("AdminLayoutClient - Checking auth:", {
        hasToken: !!token,
        localUser: localUser,
        roles: localUser?.roles,
      });

      if (!token || !localUser) {
        console.log(
          "AdminLayoutClient - No token or user, redirecting to signin"
        );
        router.push("/signin?redirect=/admin");
        return;
      }

      const hasAdminRole =
        localUser.roles &&
        Array.isArray(localUser.roles) &&
        localUser.roles.includes("ADMIN");
      console.log(
        "AdminLayoutClient - Has ADMIN role:",
        hasAdminRole,
        "Roles:",
        localUser.roles
      );

      if (!hasAdminRole) {
        console.log("AdminLayoutClient - No ADMIN role, redirecting");
        router.push("/?error=insufficient_permissions");
        return;
      }

      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        console.log(data);

        if (!data.success || !data.data.user) {
          // Token invalid, redirect to signin
          router.push("/signin?redirect=/admin");
          return;
        }

        const apiUser = data.data.user;

        if (!apiUser.isActive) {
          router.push("/signin?redirect=/admin");
          return;
        }

        const apiHasAdminRole =
          apiUser.roles &&
          Array.isArray(apiUser.roles) &&
          apiUser.roles.includes("ADMIN");
        console.log(
          "AdminLayoutClient - API user has ADMIN role:",
          apiHasAdminRole,
          "API Roles:",
          apiUser.roles
        );

        if (!apiHasAdminRole) {
          console.log(
            "AdminLayoutClient - API user no ADMIN role, redirecting"
          );
          router.push("/?error=insufficient_permissions");
          return;
        }

        // Update localStorage with latest user data (including roles)
        saveUser({
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.name,
          avatar: apiUser.avatar,
          dateOfBirth: apiUser.dateOfBirth,
          emailVerified: apiUser.emailVerified,
          isActive: apiUser.isActive,
          roles: apiUser.roles,
        });

        // Set user data
        setUser({
          id: apiUser.id,
          name: apiUser.name,
          email: apiUser.email,
          avatar: apiUser.avatar,
          roles: apiUser.roles,
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error verifying auth:", error);
        router.push("/signin?redirect=/admin");
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <QueryProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader user={user} />
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 p-6 lg:p-8">{children}</main>
        </div>
        <AdminChatButton />
      </div>
    </QueryProvider>
  );
}
