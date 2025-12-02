"use client";

import * as React from "react";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface AlertDialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<
  AlertDialogContextValue | undefined
>(undefined);

export const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onOpenChange,
  children,
}) => {
  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  // Prevent body scroll when dialog is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          {/* Dialog */}
          <div className="relative z-50 w-full max-w-lg mx-4">{children}</div>
        </div>
      )}
    </AlertDialogContext.Provider>
  );
};

export const AlertDialogTrigger: React.FC<{
  children: React.ReactNode;
  asChild?: boolean;
}> = ({ children, asChild }) => {
  const context = React.useContext(AlertDialogContext);
  if (!context)
    throw new Error("AlertDialogTrigger must be used within AlertDialog");

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => context.onOpenChange(true),
    } as any);
  }

  return <div onClick={() => context.onOpenChange(true)}>{children}</div>;
};

export const AlertDialogContent: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const context = React.useContext(AlertDialogContext);
  if (!context)
    throw new Error("AlertDialogContent must be used within AlertDialog");

  return (
    <div
      className="bg-white rounded-lg shadow-lg p-6 w-full"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
};

export const AlertDialogHeader: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <div className="mb-4">{children}</div>;
};

export const AlertDialogTitle: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <h2 className="text-lg font-semibold text-dark">{children}</h2>;
};

export const AlertDialogDescription: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <p className="text-sm text-dark-4 mt-2">{children}</p>;
};

export const AlertDialogFooter: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="flex items-center justify-end gap-3 mt-6 flex-shrink-0">
      {children}
    </div>
  );
};

export const AlertDialogCancel: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ children, onClick }) => {
  const context = React.useContext(AlertDialogContext);
  if (!context)
    throw new Error("AlertDialogCancel must be used within AlertDialog");

  return (
    <button
      type="button"
      onClick={() => {
        context.onOpenChange(false);
        onClick?.();
      }}
      className="px-4 py-2 text-sm font-medium text-dark bg-gray-2 border border-gray-3 rounded-md hover:bg-gray-3 ease-out duration-200"
    >
      {children}
    </button>
  );
};

export const AlertDialogAction: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ children, onClick, disabled }) => {
  const context = React.useContext(AlertDialogContext);
  if (!context)
    throw new Error("AlertDialogAction must be used within AlertDialog");

  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled) {
          onClick?.();
          context.onOpenChange(false);
        }
      }}
      disabled={disabled}
      className="px-4 py-2 text-sm font-medium text-white bg-blue rounded-md hover:bg-blue-dark ease-out duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
};
