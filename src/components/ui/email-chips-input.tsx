import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeToken(raw: string): string {
  return raw.trim().replace(/,+$/, '');
}

function mergeEmails(current: string[], additions: string[]): string[] {
  const next = [...current];
  for (const raw of additions) {
    const email = normalizeToken(raw);
    if (email && EMAIL_RE.test(email) && !next.includes(email)) {
      next.push(email);
    }
  }
  return next;
}

export type EmailChipsInputProps = {
  emails: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  className?: string;
  invalidHint?: string;
};

export function EmailChipsInput({
  emails,
  onChange,
  placeholder,
  className,
  invalidHint,
}: EmailChipsInputProps) {
  const [draft, setDraft] = useState('');
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const commitDraft = useCallback(
    (raw: string): boolean => {
      const value = normalizeToken(raw);
      if (!value) {
        setInvalid(false);
        return true;
      }
      if (!EMAIL_RE.test(value)) {
        setInvalid(true);
        return false;
      }
      if (!emails.includes(value)) {
        onChange([...emails, value]);
      }
      setDraft('');
      setInvalid(false);
      return true;
    },
    [emails, onChange],
  );

  const handleDraftChange = (value: string) => {
    if (value.includes(',')) {
      const parts = value.split(',');
      const tail = parts.pop() ?? '';
      const toAdd = parts.map((p) => normalizeToken(p)).filter(Boolean);
      if (toAdd.length > 0) {
        const invalidPart = toAdd.find((e) => !EMAIL_RE.test(e));
        if (invalidPart) {
          setInvalid(true);
          setDraft(value);
          return;
        }
        onChange(mergeEmails(emails, toAdd));
      }
      setDraft(tail);
      setInvalid(false);
      return;
    }
    setDraft(value);
    if (invalid) setInvalid(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (draft.trim()) {
        e.preventDefault();
        commitDraft(draft);
      }
      return;
    }
    if (e.key === ',') {
      e.preventDefault();
      commitDraft(draft);
      return;
    }
    if (e.key === 'Backspace' && !draft && emails.length > 0) {
      onChange(emails.slice(0, -1));
    }
  };

  const removeEmail = (email: string) => {
    onChange(emails.filter((e) => e !== email));
  };

  return (
    <div className="space-y-1">
      <div
        role="group"
        className={cn(
          'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm shadow-sm',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background',
          invalid && 'border-destructive focus-within:ring-destructive',
          className,
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {emails.map((email) => (
          <span
            key={email}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 pl-2.5 pr-1 py-0.5 text-xs font-medium text-primary"
          >
            <span className="truncate">{email}</span>
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-primary/20 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={(e) => {
                e.stopPropagation();
                removeEmail(email);
              }}
              aria-label={`Eliminar ${email}`}
            >
              <X className="h-3 w-3 shrink-0" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="email"
          inputMode="email"
          autoComplete="off"
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-0.5 outline-none placeholder:text-muted-foreground"
          value={draft}
          placeholder={emails.length === 0 ? placeholder : undefined}
          onChange={(e) => handleDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft.trim()) commitDraft(draft);
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text');
            if (!text.includes(',') && !text.includes('\n')) return;
            e.preventDefault();
            const parts = text.split(/[,;\n]+/);
            const valid = parts.map((p) => normalizeToken(p)).filter((p) => p && EMAIL_RE.test(p));
            const invalidPart = parts.map((p) => normalizeToken(p)).find((p) => p && !EMAIL_RE.test(p));
            if (invalidPart) {
              setInvalid(true);
              setDraft(invalidPart);
              return;
            }
            if (valid.length) onChange(mergeEmails(emails, valid));
            setDraft('');
            setInvalid(false);
          }}
        />
      </div>
      {invalid && invalidHint ? (
        <p className="text-xs text-destructive">{invalidHint}</p>
      ) : null}
    </div>
  );
}
