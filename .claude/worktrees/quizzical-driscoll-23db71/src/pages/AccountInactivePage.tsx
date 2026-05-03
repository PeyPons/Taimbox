import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { UserX, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Perfil de empleado desactivado: no puede usar la app; datos históricos siguen en informes.
 */
export default function AccountInactivePage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation("app");

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center">
            <UserX className="h-8 w-8 text-slate-600" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          {t("accountInactive.title")}
        </h1>
        <p className="text-slate-600">
          {t("accountInactive.body")}
        </p>
        <Button onClick={handleLogout} variant="outline" className="gap-2">
          <LogOut className="h-4 w-4" />
          {t("accountInactive.logout")}
        </Button>
      </div>
    </div>
  );
}
