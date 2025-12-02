import Home from "@/components/Home";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tiểu Luận CK23V7K526 - Nguyen Minh Tai",
  description: "Project of the end of the course...",
  // other metadata
};

export default function HomePage() {
  return (
    <>
      <Home />
    </>
  );
}
