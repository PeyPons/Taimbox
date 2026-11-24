import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Loader2, Pencil, StickyNote, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AnonymizedContent } from '@/components/ads/AnonymizedContent';
import { useDateLocale } from '@/hooks/useDateLocale';
import { useAdAccountNotes, useAdAccountNotesMutations } from '@/hooks/useAdAccountNotes';
import { adAccountNoteWasEdited, type AdAccountNote, type AdAccountPlatform } from '@/services/adAccountNotesService';
import { toast } from '@/lib/notify';
import { cn } from '@/lib/utils';

interface AdAccountNotesPanelProps {
  platform: AdAccountPlatform;
  accountId: string;
  anonymized?: boolean;
  compact?: boolean;
}

function NoteItem({
  note,
  anonymized,
  isSaving,
  isDeleting,
  onSave,
  onDelete,
}: {
  note: AdAccountNote;
  anonymized: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onSave: (noteId: string, body: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.body);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const authorLabel = note.authorName ?? t('adAccountNotes.authorFallback', 'Usuario');
  const created = new Date(note.createdAt);
  const absolute = format(created, 'd MMM yyyy, HH:mm', { locale: dateLocale });
  const relative = formatDistanceToNow(created, { addSuffix: true, locale: dateLocale });
  const edited = adAccountNoteWasEdited(note.createdAt, note.updatedAt);
  const editedLabel = edited
    ? format(new Date(note.updatedAt), 'd MMM yyyy, HH:mm', { locale: dateLocale })
    : '';

  const cancelEdit = () => {
    setDraft(note.body);
    setEditing(false);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-sm">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-6 w-6 shrink-0">
            {note.authorAvatarUrl ? <AvatarImage src={note.authorAvatarUrl} alt="" /> : null}
            <AvatarFallback className="text-[10px] bg-amber-100 text-amber-800">
              {authorLabel.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-700 truncate">{authorLabel}</p>
            <p className="text-[10px] text-slate-400">
              {absolute}
              <span className="text-slate-300"> · {relative}</span>
            </p>
            {edited && (
              <p className="text-[10px] text-slate-400">
                {t('adAccountNotes.edited', { date: editedLabel, defaultValue: 'Editada el {{date}}' })}
              </p>
            )}
          </div>
        </div>
        {!editing && deleteStep === 0 && (
          <div className="flex shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-700"
              onClick={() => {
                setDraft(note.body);
                setEditing(true);
              }}
              aria-label={t('adAccountNotes.editAria', 'Editar nota')}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-red-600"
              disabled={isDeleting}
              onClick={() => setDeleteStep(1)}
              aria-label={t('adAccountNotes.deleteAria', 'Eliminar nota')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={4000}
            className="text-sm resize-none min-h-[72px]"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
              {t('adAccountNotes.cancel', 'Cancelar')}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSaving || !draft.trim()}
              onClick={() => {
                void onSave(note.id, draft).then(() => setEditing(false)).catch(() => undefined);
              }}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('adAccountNotes.save', 'Guardar')}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-slate-700 whitespace-pre-wrap break-words text-sm leading-relaxed">
          <AnonymizedContent isActive={anonymized} asBlock>
            {note.body}
          </AnonymizedContent>
        </p>
      )}

      {deleteStep > 0 && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 space-y-2">
          <p className="text-xs text-red-800">
            {deleteStep === 1
              ? t('adAccountNotes.deleteStep1', '¿Eliminar esta nota?')
              : t('adAccountNotes.deleteStep2', 'Confirma otra vez. La nota se borrará y no se puede deshacer.')}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteStep(deleteStep === 2 ? 1 : 0)}
            >
              {deleteStep === 2
                ? t('adAccountNotes.back', 'Volver')
                : t('adAccountNotes.cancel', 'Cancelar')}
            </Button>
            {deleteStep === 1 ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setDeleteStep(2)}>
                {t('adAccountNotes.continue', 'Continuar')}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isDeleting}
                onClick={() => {
                  void onDelete(note.id).catch(() => undefined);
                }}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('adAccountNotes.deleteConfirm', 'Eliminar nota')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdAccountNotesPanel({
  platform,
  accountId,
  anonymized = false,
  compact = false,
}: AdAccountNotesPanelProps) {
  const { t } = useTranslation();
  const { data: notes = [], isLoading } = useAdAccountNotes(platform, accountId);
  const { addNote, editNote, deleteNote, isAdding, isSaving, isDeleting, maxLength } = useAdAccountNotesMutations(
    platform,
    accountId,
  );
  const [draft, setDraft] = useState('');

  const handleSubmit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    try {
      await addNote(trimmed);
      setDraft('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('adAccountNotes.saveError', 'No se pudo guardar la nota'));
    }
  };

  const handleSave = async (noteId: string, body: string) => {
    try {
      await editNote({ noteId, body });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('adAccountNotes.saveError', 'No se pudo guardar la nota'));
      throw err;
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deleteNote(noteId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('adAccountNotes.deleteError', 'No se pudo eliminar la nota'));
      throw err;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-amber-600 shrink-0" />
        <h4 className="text-sm font-semibold text-slate-800">{t('adAccountNotes.title', 'Notas de la cuenta')}</h4>
      </div>
      {!compact && (
        <p className="text-xs text-slate-500 leading-relaxed">
          {t('adAccountNotes.hint', 'Visibles para el equipo de la agencia. Se guarda quién la escribió y cuándo.')}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-1">{t('adAccountNotes.empty', 'Sin notas todavía.')}</p>
      ) : (
        <div className={cn('flex flex-col gap-2 overscroll-y-contain', compact ? 'max-h-48 overflow-y-auto pr-1' : 'max-h-64 overflow-y-auto pr-1')}>
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              anonymized={anonymized}
              isSaving={isSaving}
              isDeleting={isDeleting}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <div className="space-y-2 pt-1 border-t border-slate-100">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder={t('adAccountNotes.placeholder', 'Algo que el equipo deba saber de esta cuenta…')}
          rows={compact ? 2 : 3}
          maxLength={maxLength}
          className={cn('text-sm resize-none', compact ? 'min-h-[56px]' : 'min-h-[72px]')}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-400">
            {draft.length}/{maxLength}
          </span>
          <Button type="button" size="sm" disabled={isAdding || !draft.trim()} onClick={() => void handleSubmit()}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : t('adAccountNotes.add', 'Añadir nota')}
          </Button>
        </div>
      </div>
    </div>
  );
}
