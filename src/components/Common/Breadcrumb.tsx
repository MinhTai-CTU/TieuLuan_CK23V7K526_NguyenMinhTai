import Link from "next/link";
import React from "react";

interface BreadcrumbProps {
  title: string;
  pages: Array<string | { label: string; href: string }>;
}

const Breadcrumb = ({ title, pages }: BreadcrumbProps) => {
  // Map page names to their routes
  const getPageRoute = (
    page: string | { label: string; href: string }
  ): string => {
    if (typeof page === "object") {
      return page.href;
    }
    // Default routes for common page names
    const routeMap: { [key: string]: string } = {
      checkout: "/checkout",
      addresses: "/checkout/addresses",
      cart: "/cart",
      shop: "/shop",
    };
    return routeMap[page.toLowerCase()] || `/${page.toLowerCase()}`;
  };

  const getPageLabel = (
    page: string | { label: string; href: string }
  ): string => {
    if (typeof page === "object") {
      return page.label;
    }
    return page;
  };

  return (
    <div className="overflow-hidden shadow-breadcrumb pt-[209px] sm:pt-[155px] lg:pt-[95px] xl:pt-[165px]">
      <div className="border-t border-gray-3">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 py-5 xl:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="font-semibold text-dark text-xl sm:text-2xl xl:text-custom-2">
              {title}
            </h1>

            <ul className="flex items-center gap-2">
              <li className="text-custom-sm hover:text-blue">
                <Link href="/">Home /</Link>
              </li>

              {pages.length > 0 &&
                pages.map((page, key) => {
                  const isLast = key === pages.length - 1;
                  const pageLabel = getPageLabel(page);
                  const pageRoute = getPageRoute(page);

                  return (
                    <li
                      className={`text-custom-sm capitalize ${
                        isLast ? "text-blue" : "hover:text-blue"
                      }`}
                      key={key}
                    >
                      {isLast ? (
                        <span>{pageLabel}</span>
                      ) : (
                        <Link href={pageRoute} className="hover:text-blue">
                          {pageLabel} /
                        </Link>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;
