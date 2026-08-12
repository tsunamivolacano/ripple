import { useState, useCallback } from "react";
import { toast } from "sonner";

type Toast = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
      toast.dismiss(toastId);
    } else {
      setToasts([]);
      toast.dismiss();
    }
  }, []);

  return {
    toasts,
    toast: useCallback((options: { title?: string; description?: string; variant?: "default" | "destructive" }) => {
      const id = Math.random().toString(36).substring(7);
      const newToast = { id, ...options };
      setToasts((prev) => [...prev, newToast]);
      if (options.variant === "destructive") {
        toast.error(options.title || "", { description: options.description });
      } else {
        toast.success(options.title || "", { description: options.description });
      }
      return { id, dismiss: () => dismiss(id) };
    }, []),
    dismiss,
  };
}

export { toast };