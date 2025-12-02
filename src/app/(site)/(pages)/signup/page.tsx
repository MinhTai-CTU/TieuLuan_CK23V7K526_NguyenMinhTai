import Signup from "@/components/Auth/Signup";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import React from "react";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Signup Page | NextCommerce Nextjs E-commerce template",
  description: "This is Signup Page for NextCommerce Template",
  // other metadata
};

const SignupPage = () => {
  return (
    <ProtectedRoute>
      <main>
        <Signup />
      </main>
    </ProtectedRoute>
  );
};

export default SignupPage;
