import Header from "../../components/Header";
import Footer from "../../components/Footer";
import QuickViewModal from "@/components/Common/QuickViewModal";
import CartSidebarModal from "@/components/Common/CartSidebarModal";
import PreviewSliderModal from "@/components/Common/PreviewSlider";
import ChatWidget from "@/components/Chat/ChatWidget";
import AdminChatButton from "@/components/Admin/AdminChatButton";
import OrderStatusListener from "@/components/Orders/OrderStatusListener";
import RouteChangeLoader from "@/components/Common/RouteChangeLoader";
import { Suspense } from "react";
import Providers from "./providers";
import UserStatusGuard from "@/components/Auth/UserStatusGuard";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <RouteChangeLoader />
      </Suspense>
      <UserStatusGuard>
        <Providers>
          <Header />
          {children}
          <QuickViewModal />
          <CartSidebarModal />
          <PreviewSliderModal />
          <OrderStatusListener />
          <AdminChatButton />
          <ChatWidget />
        </Providers>
      </UserStatusGuard>
      <Footer />
    </>
  );
}
