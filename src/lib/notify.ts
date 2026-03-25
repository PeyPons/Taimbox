/**
 * Fachada única para toasts (Sileo). No importar `sileo` fuera de este módulo.
 */
import { sileo, Toaster as SileoToaster } from 'sileo';

export { SileoToaster as Toaster };

type SonnerLikeOptions = {
  description?: string;
  duration?: number | null;
};

function toSileoOpts(message: string, opts?: SonnerLikeOptions) {
  const base: { title?: string; description?: string; duration?: number | null } = {
    duration: opts?.duration,
  };
  if (opts?.description) {
    base.title = message;
    base.description = opts.description;
  } else {
    base.title = message;
  }
  return base;
}

export const toast = {
  success: (message: string, opts?: SonnerLikeOptions) => sileo.success(toSileoOpts(message, opts)),

  error: (message: string, opts?: SonnerLikeOptions) => sileo.error(toSileoOpts(message, opts)),

  warning: (message: string, opts?: SonnerLikeOptions) => sileo.warning(toSileoOpts(message, opts)),

  info: (message: string, opts?: SonnerLikeOptions) => sileo.info(toSileoOpts(message, opts)),

  promise: sileo.promise.bind(sileo) as typeof sileo.promise,
};

/** Compatibilidad con el antiguo API tipo Radix/shadcn `{ title, description, variant }`. */
export function toastLegacy(options: {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}): void {
  const { title, description, variant } = options;
  if (variant === 'destructive') {
    sileo.error({
      title: title || 'Error',
      description,
    });
    return;
  }
  if (title && description) {
    sileo.success({ title, description });
  } else {
    sileo.success({ title: title || description || '' });
  }
}

export function useToastShim() {
  return {
    toast: toastLegacy,
    toasts: [] as const,
    dismiss: () => sileo.clear(),
  };
}
