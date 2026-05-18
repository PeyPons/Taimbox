// Componente de ajustes de cuenta del empleado
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  /** En móvil: solo icono, sin etiqueta «Ajustes». */
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
  const { i18n } = useTranslation();
  const employee = employees.find(e => e.id === employeeId);
  const [open, setOpen] = useState(false);
  const currentLang = i18n.language.startsWith('en') ? 'en' : 'es';
  const [isUpdating, setIsUpdating] = useState(false);

  // Estados para contraseña
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados para avatar
  const [avatarPhrase, setAvatarPhrase] = useState('');
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  /** Evita autofill de email: el input empieza readonly y se desbloquea al enfocar. */
  const [avatarSeedUnlocked, setAvatarSeedUnlocked] = useState(false);

  const currentAvatarSeed = useMemo(() => {
    if (!employee) return '';
    return (dicebearSeedFromAvatarUrl(employee.avatarUrl) ?? employee.name.trim()) || 'tu nombre';
  }, [employee]);

  const avatarPhrasePlaceholder = useMemo(() => {
    const s = currentAvatarSeed;
    if (!s) return 'Escribe una frase para tu avatar (no es tu correo)';
    if (s.length <= 72) return `Frase actual: «${s}» — escribe otra para cambiar`;
    return `Frase actual: «${s.slice(0, 69)}…» — escribe otra para cambiar`;
  }, [currentAvatarSeed]);

  if (!employee || !currentUser || currentUser.id !== employeeId) {
    return null;
  }

  const generateAvatarUrl = (phrase: string) => {
    if (!phrase.trim()) return null;
    // Usar DiceBear con el estilo fun-emoji, usando la frase como seed
    return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(phrase.trim())}`;
  };

  const handleAvatarPhraseChange = (phrase: string) => {
    setAvatarPhrase(phrase);
    const newAvatarUrl = generateAvatarUrl(phrase);
    setPreviewAvatar(newAvatarUrl);
  };

  const handleUpdateAvatar = async () => {
    if (!avatarPhrase.trim()) {
      toast.error('Escribe una frase para generar tu avatar');
      return;
    }

    setIsUpdating(true);
    try {
      const newAvatarUrl = generateAvatarUrl(avatarPhrase);
      if (!newAvatarUrl) {
        toast.error('Error al generar el avatar');
        return;
      }

      await updateEmployee({
        ...employee,
        avatarUrl: newAvatarUrl
      });

      toast.success('Avatar actualizado correctamente');
      setAvatarPhrase('');
      setPreviewAvatar(null);
    } catch (error) {
      console.error('Error actualizando avatar:', error);
      toast.error('Error al actualizar el avatar');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Completa todos los campos de contraseña');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('No se pudo obtener la información del usuario');
        return;
      }

      // Llamar a la función edge de Supabase para actualizar la contraseña
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const response = await fetch(`${supabaseUrl}/functions/v1/update-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          userId: user.id,
          password: newPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cambiar la contraseña');
      }

      toast.success('Contraseña actualizada correctamente');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      toast.error((error as Error)?.message || 'Error al cambiar la contraseña');
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
          aria-label="Ajustes"
        >
          <Settings className="h-4 w-4" />
          {!compact && 'Ajustes'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-600" />
            Ajustes de cuenta
          </DialogTitle>
          <DialogDescription>
            Avatar y contraseña se guardan por separado: usa «Guardar avatar» para el avatar y «Cambiar contraseña» solo si quieres cambiar la contraseña.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Trampa de autofill: los gestores suelen rellenar el primer campo de texto junto a contraseñas con el email. */}
          <input
            type="text"
            name="user-identifier-decoy"
            autoComplete="username"
            defaultValue=""
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
          {/* Sección Avatar */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <User className="h-4 w-4" />
              Avatar
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
                <Label htmlFor="avatar-phrase">Frase para generar avatar</Label>
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
                        handleUpdateAvatar();
                      }
                    }}
                  />
                  <Button
                    onClick={handleUpdateAvatar}
                    disabled={isUpdating || !avatarPhrase.trim()}
                    variant="secondary"
                    className="shrink-0"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                    {isUpdating ? 'Guardando...' : 'Guardar avatar'}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  No es tu correo: solo una frase o palabra para el generador de caras. El placeholder muestra la frase
                  que usa tu avatar ahora. Haz clic en «Guardar avatar» para aplicar el cambio (no hace falta cambiar la
                  contraseña).
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          {/* Sección Idioma */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Globe className="h-4 w-4" />
              Idioma / Language
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
                      toast.success(lang.code === 'en' ? 'Language changed to English' : 'Idioma cambiado a Español');
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
              {currentLang === 'en'
                ? 'Changes the interface language. This preference is saved in your browser.'
                : 'Cambia el idioma de la interfaz. Esta preferencia se guarda en tu navegador.'}
            </p>
          </div>

          <div className="h-px bg-slate-200" />

          {/* Sección Contraseña */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Lock className="h-4 w-4" />
              Cambiar contraseña
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repite la nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPassword && confirmPassword) {
                      handleChangePassword();
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
          <Button
            onClick={handleChangePassword}
            disabled={isUpdating || !newPassword || !confirmPassword}
            className="bg-primary hover:bg-primary/90"
          >
            {isUpdating ? 'Actualizando...' : 'Cambiar contraseña'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

