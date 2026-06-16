// Componente de ajustes de cuenta del empleado
import { useMemo, useState } from 'react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, Lock, User, RefreshCw, Globe, Check } from 'lucide-react';
import { toast } from '@/lib/notify';
import { cn } from '@/lib/utils';

interface EmployeeSettingsProps {
  employeeId: string;
  /** En móvil: solo icono, sin etiqueta. */
  compact?: boolean;
}

const LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
] as const;

/** Semilla actual del avatar DiceBear (para placeholder y copy claro: no es el email). */
function dicebearSeedFromAvatarUrl(url: string | undefined | null): string | null {
  if (!url || !url.includes('dicebear.com')) return null;
  try {
    const seed = new URL(url).searchParams.get('seed');
    if (!seed) return null;
    return decodeURIComponent(seed.replace(/\+/g, ' '));
  } catch {
    return null;
  }
}

export function EmployeeSettings({ employeeId, compact = false }: EmployeeSettingsProps) {
  const { employees, updateEmployee, currentUser } = useApp();
  const { t, i18n } = useAppTranslation();
  const employee = employees.find(e => e.id === employeeId);
  const [open, setOpen] = useState(false);
  const currentLang = i18n.language.startsWith('en') ? 'en' : 'es';
  const [isUpdating, setIsUpdating] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [avatarPhrase, setAvatarPhrase] = useState('');
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [avatarSeedUnlocked, setAvatarSeedUnlocked] = useState(false);

  const currentAvatarSeed = useMemo(() => {
    if (!employee) return '';
    return (dicebearSeedFromAvatarUrl(employee.avatarUrl) ?? employee.name.trim()) || t('employeeSettings.avatar.defaultSeed', 'your name');
  }, [employee, t]);

  const avatarPhrasePlaceholder = useMemo(() => {
    const s = currentAvatarSeed;
    if (!s) return t('employeeSettings.avatar.placeholderEmpty', 'Write a phrase for your avatar (not your email)');
    if (s.length <= 72) {
      return t('employeeSettings.avatar.placeholderCurrent', 'Current phrase: «{{phrase}}» — write another to change', { phrase: s });
    }
    return t('employeeSettings.avatar.placeholderCurrentTruncated', 'Current phrase: «{{phrase}}…» — write another to change', {
      phrase: s.slice(0, 69),
    });
  }, [currentAvatarSeed, t]);

  if (!employee || !currentUser || currentUser.id !== employeeId) {
    return null;
  }

  const generateAvatarUrl = (phrase: string) => {
    if (!phrase.trim()) return null;
    return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(phrase.trim())}`;
  };

  const handleAvatarPhraseChange = (phrase: string) => {
    setAvatarPhrase(phrase);
    setPreviewAvatar(generateAvatarUrl(phrase));
  };

  const handleUpdateAvatar = async () => {
    if (!avatarPhrase.trim()) {
      toast.error(t('employeeSettings.avatar.toast.phraseRequired', 'Write a phrase to generate your avatar'));
      return;
    }

    setIsUpdating(true);
    try {
      const newAvatarUrl = generateAvatarUrl(avatarPhrase);
      if (!newAvatarUrl) {
        toast.error(t('employeeSettings.avatar.toast.generateError', 'Error generating avatar'));
        return;
      }

      await updateEmployee({
        ...employee,
        avatarUrl: newAvatarUrl,
      });

      toast.success(t('employeeSettings.avatar.toast.updated', 'Avatar updated successfully'));
      setAvatarPhrase('');
      setPreviewAvatar(null);
    } catch (error) {
      console.error('Error actualizando avatar:', error);
      toast.error(t('employeeSettings.avatar.toast.updateError', 'Error updating avatar'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error(t('employeeSettings.password.toast.fieldsRequired', 'Fill in all password fields'));
      return;
    }

    if (newPassword.length < 8) {
      toast.error(t('employeeSettings.password.toast.tooShort', 'Password must be at least 8 characters'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('employeeSettings.password.toast.mismatch', 'Passwords do not match'));
      return;
    }

    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('employeeSettings.password.toast.userError', 'Could not get user information'));
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const response = await fetch(`${supabaseUrl}/functions/v1/update-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          password: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('employeeSettings.password.toast.changeError', 'Error changing password'));
      }

      toast.success(t('employeeSettings.password.toast.updated', 'Password updated successfully'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      toast.error((error as Error)?.message || t('employeeSettings.password.toast.changeError', 'Error changing password'));
    } finally {
      setIsUpdating(false);
    }
  };

  const currentAvatarUrl = previewAvatar || employee.avatarUrl || generateAvatarUrl(employee.name);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setAvatarSeedUnlocked(false);
        } else {
          setAvatarPhrase('');
          setPreviewAvatar(null);
          setAvatarSeedUnlocked(false);
          setNewPassword('');
          setConfirmPassword('');
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn('gap-2', compact && 'h-10 w-10 min-h-[44px] min-w-[44px] p-0 shrink-0')}
          size="sm"
          aria-label={t('employeeSettings.triggerAria', 'Settings')}
        >
          <Settings className="h-4 w-4" />
          {!compact && t('employeeSettings.trigger', 'Settings')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-600" />
            {t('employeeSettings.title', 'Account settings')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'employeeSettings.description',
              'Avatar and password are saved separately: use «Save avatar» for the avatar and «Change password» only if you want to change your password.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <input
            type="text"
            name="user-identifier-decoy"
            autoComplete="username"
            defaultValue=""
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <User className="h-4 w-4" />
              {t('employeeSettings.avatar.sectionTitle', 'Avatar')}
            </div>

            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-slate-200">
                <AvatarImage src={currentAvatarUrl || undefined} alt={employee.name} />
                <AvatarFallback className="bg-primary text-white font-medium text-lg">
                  {employee.first_name?.[0] || employee.name[0]}
                  {employee.last_name?.[0] || employee.name[1]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <Label htmlFor="avatar-phrase">{t('employeeSettings.avatar.phraseLabel', 'Phrase to generate avatar')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="avatar-phrase"
                    name="avatar-seed-phrase"
                    type="text"
                    inputMode="text"
                    autoComplete="nickname"
                    autoCapitalize="sentences"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    readOnly={!avatarSeedUnlocked}
                    placeholder={avatarPhrasePlaceholder}
                    value={avatarPhrase}
                    onChange={(e) => handleAvatarPhraseChange(e.target.value)}
                    onFocus={() => setAvatarSeedUnlocked(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && avatarPhrase.trim()) {
                        void handleUpdateAvatar();
                      }
                    }}
                  />
                  <Button
                    onClick={() => void handleUpdateAvatar()}
                    disabled={isUpdating || !avatarPhrase.trim()}
                    variant="secondary"
                    className="shrink-0"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                    {isUpdating
                      ? t('employeeSettings.avatar.saving', 'Saving…')
                      : t('employeeSettings.avatar.save', 'Save avatar')}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  {t(
                    'employeeSettings.avatar.hint',
                    'Not your email: just a phrase or word for the face generator. The placeholder shows your avatar’s current phrase. Click «Save avatar» to apply (no need to change your password).'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Globe className="h-4 w-4" />
              {t('employeeSettings.language.sectionTitle', 'Language')}
            </div>
            <div className="flex gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    if (lang.code !== currentLang) {
                      i18n.changeLanguage(lang.code);
                      localStorage.setItem('i18nextLng', lang.code);
                      toast.success(
                        lang.code === 'en'
                          ? t('employeeSettings.language.toastEn', 'Language changed to English')
                          : t('employeeSettings.language.toastEs', 'Idioma cambiado a Español')
                      );
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                    currentLang === lang.code
                      ? 'border-primary bg-primary/5 text-primary shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {currentLang === lang.code && <Check className="h-4 w-4 ml-1" />}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {t('employeeSettings.language.hint', 'Changes the interface language. This preference is saved in your browser.')}
            </p>
          </div>

          <div className="h-px bg-slate-200" />

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Lock className="h-4 w-4" />
              {t('employeeSettings.password.sectionTitle', 'Change password')}
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-password">{t('employeeSettings.password.newLabel', 'New password')}</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('employeeSettings.password.newPlaceholder', 'Minimum 8 characters')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('employeeSettings.password.confirmLabel', 'Confirm password')}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('employeeSettings.password.confirmPlaceholder', 'Repeat the new password')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPassword && confirmPassword) {
                      void handleChangePassword();
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('employeeSettings.close', 'Close')}
          </Button>
          <Button
            onClick={() => void handleChangePassword()}
            disabled={isUpdating || !newPassword || !confirmPassword}
            className="bg-primary hover:bg-primary/90"
          >
            {isUpdating
              ? t('employeeSettings.password.updating', 'Updating…')
              : t('employeeSettings.password.submit', 'Change password')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
