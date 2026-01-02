import ForgotPassword from "@/components/Auth/ForgotPassword";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password Page | NextCommerce Nextjs E-commerce template",
  description: "This is Forgot Password Page for NextCommerce Template",
  // other metadata
};

const ForgotPasswordPage = () => {
  return (
    <ProtectedRoute>
      <main>
        <ForgotPassword />
      </main>
    </ProtectedRoute>
  );
};

export default ForgotPasswordPage;
