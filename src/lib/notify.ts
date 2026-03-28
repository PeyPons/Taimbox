/**
 * Fachada única para toasts (Sonner). No importar `sonner` fuera de este módulo salvo el `<Toaster />` en `App`.
 */
import { toast as sonnerToast } from 'sonner';

export { Toaster } from '@/components/ui/sonner';

type SonnerLikeOptions = {
  description?: string;
  duration?: number | null;
};

function toExternalToast(opts?: SonnerLikeOptions) {
  const out: { description?: string; duration?: number } = {};
  if (opts?.description) out.description = opts.description;
  if (opts?.duration === null) out.duration = Infinity;
  else if (opts?.duration !== undefined) out.duration = opts.duration;
  return out;
}

export const toast = {
  success: (message: string, opts?: SonnerLikeOptions) =>
    sonnerToast.success(message, toExternalToast(opts)),

  error: (message: string, opts?: SonnerLikeOptions) =>
    sonnerToast.error(message, toExternalToast(opts)),

  warning: (message: string, opts?: SonnerLikeOptions) =>
    sonnerToast.warning(message, toExternalToast(opts)),

  info: (message: string, opts?: SonnerLikeOptions) =>
    sonnerToast.info(message, toExternalToast(opts)),

  promise: sonnerToast.promise.bind(sonnerToast),
};

/** Compatibilidad con el API tipo Radix/shadcn `{ title, description, variant }`. */
export function toastLegacy(options: {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}): void {
  const { title, description, variant } = options;
  if (variant === 'destructive') {
    sonnerToast.error(title || 'Error', { description });
    return;
  }
  if (title && description) {
    sonnerToast.success(title, { description });
  } else {
    sonnerToast.success(title || description || '');
  }
}

export function useToastShim() {
  return {
    toast: toastLegacy,
    toasts: [] as const,
    dismiss: () => sonnerToast.dismiss(),
  };
}
