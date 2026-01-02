import ResetPassword from "@/components/Auth/ResetPassword";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password Page | NextCommerce Nextjs E-commerce template",
  description: "This is Reset Password Page for NextCommerce Template",
  // other metadata
};

const ResetPasswordPage = () => {
  return (
    <ProtectedRoute>
      <main>
        <ResetPassword />
      </main>
    </ProtectedRoute>
  );
};

export default ResetPasswordPage;
