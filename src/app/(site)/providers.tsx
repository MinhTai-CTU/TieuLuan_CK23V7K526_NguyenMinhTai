"use client";
import { ModalProvider } from "../context/QuickViewModalContext";
import { CartModalProvider } from "../context/CartSidebarModalContext";
import { PreviewSliderProvider } from "../context/PreviewSliderContext";
import { QueryProvider } from "../providers/query-provider";
import UserStatusChecker from "@/components/Auth/UserStatusChecker";

/**
 * Client-side providers wrapper
 * Contains all client-side contexts and providers
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <CartModalProvider>
        <ModalProvider>
          <PreviewSliderProvider>
            <UserStatusChecker />
            {children}
          </PreviewSliderProvider>
        </ModalProvider>
      </CartModalProvider>
    </QueryProvider>
  );
}
