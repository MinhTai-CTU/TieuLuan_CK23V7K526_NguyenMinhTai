import Signin from "@/components/Auth/Signin";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signin Page | NextCommerce Nextjs E-commerce template",
  description: "This is Signin Page for NextCommerce Template",
  // other metadata
};

const SigninPage = () => {
  return (
    <ProtectedRoute>
      <main>
        <Signin />
      </main>
    </ProtectedRoute>
  );
};

export default SigninPage;
