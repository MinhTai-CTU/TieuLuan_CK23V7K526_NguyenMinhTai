import AdminLayoutClient from "@/components/Admin/AdminLayoutClient";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use client component to check auth from localStorage
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
