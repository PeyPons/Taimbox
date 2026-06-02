import { useAppTranslation } from "@/hooks/useAppTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function AdminDocsPage() {
  const { t } = useAppTranslation();
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("admin.docs.title")}</h1>
        <p className="text-slate-600 mt-1">{t("admin.docs.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {t("admin.docs.agenciesTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>{t("admin.docs.agenciesSuspend")}</p>
          <p>{t("admin.docs.agenciesReactivate")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {t("admin.docs.supportTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>{t("admin.docs.supportTickets")}</p>
          <p>{t("admin.docs.supportCreate")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {t("admin.docs.metricsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>{t("admin.docs.metricsBody")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {t("admin.docs.adminsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>{t("admin.docs.adminsBody")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {t("admin.docs.accessTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>{t("admin.docs.accessBody")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
