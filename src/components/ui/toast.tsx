"use client";

import * as React from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "error";

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: Variant;
}

interface ToastContextValue {
  toast: (opts: {
    title: string;
    description?: string;
    variant?: Variant;
  }) => void;
}

const ToastContext = React.createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback<ToastContextValue["toast"]>(
    ({ title, description, variant = "default" }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border bg-background p-3 shadow-lg",
              t.variant === "success" && "border-green-500/40",
              t.variant === "error" && "border-red-500/40"
            )}
          >
            {t.variant === "success" && (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
            )}
            {t.variant === "error" && (
              <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{t.title}</div>
              {t.description && (
                <div className="text-xs text-muted-foreground">
                  {t.description}
                </div>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
