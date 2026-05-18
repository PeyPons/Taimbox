import { useEffect, useRef, useState } from 'react';
import { useMouseWheelScroll } from '@/hooks/useMouseWheelScroll';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { StickyNote, Trash2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { usePermissions } from '@/hooks/usePermissions';
import { useAllocationNotes, useAllocationNotesMutations } from '@/hooks/useAllocationNotes';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/lib/notify';
import { cn } from '@/lib/utils';
import type { AllocationNote } from '@/types';

interface TaskNotesPanelProps {
  allocationId: string;
  className?: string;
  compact?: boolean;
  /** Enfocar el textarea al abrir (p. ej. añadir la primera anotación rápido) */
  autoFocusDraft?: boolean;
}

function NoteItem({
  note,
  canDelete,
  onDelete,
  isDeleting,
}: {
  note: AllocationNote;
  canDelete: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const authorLabel = note.authorName ?? 'Usuario';
  const when = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: es });

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-sm">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-6 w-6 shrink-0">
            {note.authorAvatarUrl ? <AvatarImage src={note.authorAvatarUrl} alt="" /> : null}
            <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700">
              {authorLabel.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-700 truncate">{authorLabel}</p>
            <p className="text-[10px] text-slate-400">{when}</p>
          </div>
        </div>
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-slate-400 hover:text-red-600"
            disabled={isDeleting}
            onClick={() => onDelete(note.id)}
            aria-label="Eliminar anotación"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <p className="text-slate-700 whitespace-pre-wrap break-words text-sm leading-relaxed">
        <SensitiveText kind="task" id={note.allocationId} asBlock>
          {note.body}
        </SensitiveText>
      </p>
    </div>
  );
}

export function TaskNotesPanel({ allocationId, className, compact = false, autoFocusDraft = false }: TaskNotesPanelProps) {
  const { t } = useTranslation();
  const { currentUser } = useApp();
  const { hasPermission } = usePermissions();
  const { data: notes = [], isLoading } = useAllocationNotes(allocationId);
  const { addNote, deleteNote, isAdding, isDeleting, maxLength } = useAllocationNotesMutations(allocationId);
  const [draft, setDraft] = useState('');
  const notesScrollRef = useMouseWheelScroll<HTMLDivElement>();
  const draftRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!autoFocusDraft || isLoading || notes.length > 0) return;
    const id = window.requestAnimationFrame(() => draftRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [autoFocusDraft, isLoading, notes.length]);

  const handleSubmit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    try {
      await addNote(trimmed);
      setDraft('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('taskNotes.saveError', 'No se pudo guardar la anotación'));
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deleteNote(noteId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('taskNotes.deleteError', 'No se pudo eliminar la anotación'));
    }
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-amber-600 shrink-0" />
        <h4 className="text-sm font-semibold text-slate-800">
          {t('taskNotes.title', 'Anotaciones')}
        </h4>
      </div>

      {!compact && (
        <p className="text-xs text-slate-500 leading-relaxed">
          {t(
            'taskNotes.hint',
            'Usa un título corto en la tarea y pon aquí el detalle (idiomas, enlaces, criterios…).'
          )}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        compact ? null : (
          <p className="text-xs text-slate-400 italic py-1">
            {t('taskNotes.empty', 'Sin anotaciones todavía.')}
          </p>
        )
      ) : (
        <div
          ref={notesScrollRef}
          className={cn('flex flex-col gap-2 overscroll-y-contain', compact ? 'max-h-36 overflow-y-auto pr-1' : 'max-h-52 overflow-y-auto pr-1')}
        >
          {notes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              canDelete={hasPermission('can_access_agency_settings') || note.authorEmployeeId === currentUser?.id}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}

      <div className="space-y-2 pt-1 border-t border-slate-100">
        <Textarea
          ref={draftRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder={t(
            'taskNotes.placeholder',
            'Detalle: qué hacer en ES / EN / DE, enlaces, criterios…'
          )}
          rows={compact ? 2 : 3}
          maxLength={maxLength}
          className={cn('text-sm resize-none', compact ? 'min-h-[56px]' : 'min-h-[72px]')}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-400">
            {draft.length}/{maxLength}
            {compact && (
              <span className="hidden sm:inline text-slate-300"> · Ctrl+Enter</span>
            )}
          </span>
          <Button type="button" size="sm" disabled={isAdding || !draft.trim()} onClick={() => void handleSubmit()}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : t('taskNotes.add', 'Añadir anotación')}
          </Button>
        </div>
      </div>
    </div>
  );
}
