"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useChatUnreadCount } from "@/hooks/queries/useChatUnreadCount";

interface HeaderProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
}

export default function AdminHeader({ user }: HeaderProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { data: chatUnreadData } = useChatUnreadCount();

  const handleLogout = async () => {
    await logout();
    router.push("/signin");
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-30">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-blue font-semibold hover:underline">
            ← Về trang chủ
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user.name || "User"}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name || "Avatar"}
                width={40}
                height={40}
                className="rounded-full"
                unoptimized={user.avatar.startsWith("/uploads/")}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue flex items-center justify-center text-white font-semibold">
                {(user.name || user.email)[0].toUpperCase()}
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
