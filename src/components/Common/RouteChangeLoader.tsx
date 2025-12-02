"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const RouteChangeLoader = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const isFirstMount = useRef(true);
  const prevPathname = useRef(pathname);
  const prevSearchParams = useRef(searchParams.toString());

  useEffect(() => {
    // Skip loading on first mount
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevPathname.current = pathname;
      prevSearchParams.current = searchParams.toString();
      return;
    }

    // Only show loading if pathname or searchParams actually changed
    const pathnameChanged = prevPathname.current !== pathname;
    const searchParamsChanged =
      prevSearchParams.current !== searchParams.toString();

    if (pathnameChanged || searchParamsChanged) {
      // Update refs
      prevPathname.current = pathname;
      prevSearchParams.current = searchParams.toString();

      // Set loading to true when route changes
      setIsLoading(true);

      // Hide loading after 0.5 seconds
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);

      // Cleanup timer on unmount or route change
      return () => {
        clearTimeout(timer);
      };
    }
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex h-screen w-screen items-center justify-center bg-white">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue border-t-transparent"></div>
    </div>
  );
};

export default RouteChangeLoader;
