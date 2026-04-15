import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface NotificationEmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string | null;
  html: string | null;
  note: string | null;
  loading: boolean;
  error: string | null;
}

export function NotificationEmailPreviewDialog({
  open,
  onOpenChange,
  subject,
  html,
  note,
  loading,
  error,
}: NotificationEmailPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-3">
        <DialogHeader className="shrink-0">
          <DialogTitle>Vista previa del correo</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1 text-left">
              {subject ? (
                <p className="text-sm text-slate-700">
                  <span className="font-medium text-slate-900">Asunto:</span> {subject}
                </p>
              ) : null}
              {note ? <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">{note}</p> : null}
              <p className="text-xs text-slate-500">
                Vista aproximada del HTML que envía Resend. El cliente de correo puede aplicar estilos distintos.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-[200px] flex-1 rounded-md border bg-slate-100 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-slate-500 py-16">
              <Loader2 className="h-6 w-6 animate-spin" />
              Generando vista previa…
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-destructive">{error}</div>
          ) : html ? (
            <iframe
              title="Vista previa del correo"
              className="w-full flex-1 min-h-[320px] bg-white border-0"
              sandbox="allow-scripts allow-same-origin"
              srcDoc={html}
            />
          ) : (
            <div className="p-4 text-sm text-slate-500">Sin contenido.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
