import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, Moon, Sun, Globe } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { db } from "@/services/tauriBridge";
import { useSettingsStore } from "@/stores/settingsStore";
import type { AppSettings } from "@/types";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, language, setLanguage } = useSettingsStore();
  const [formData, setFormData] = useState<Partial<AppSettings>>({});

  const { data: dbSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: db.getSettings,
  });

  useEffect(() => {
    if (dbSettings) {
      setFormData(dbSettings as Partial<AppSettings>);
    }
  }, [dbSettings]);

  const saveMutation = useMutation({
    mutationFn: () => db.updateSettings(formData),
    onSuccess: () => toast.success(t("settings.saved")),
    onError: (e) => toast.error(String(e)),
  });

  const handleChange = (key: keyof AppSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleThemeChange = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    handleChange("theme", newTheme);
  };

  const handleLanguageChange = (lang: "ar" | "fr" | "en") => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    handleChange("language", lang);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>

      {/* Store Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.storeInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("settings.storeName")}</Label>
            <Input
              value={formData.store_name ?? ""}
              onChange={(e) => handleChange("store_name", e.target.value)}
              placeholder="اسم المتجر"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("settings.storePhone")}</Label>
              <Input
                value={formData.store_phone ?? ""}
                onChange={(e) => handleChange("store_phone", e.target.value)}
                placeholder="0555..."
                className="ltr"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("settings.currency")}</Label>
              <Input
                value={formData.currency ?? "دج"}
                onChange={(e) => handleChange("currency", e.target.value)}
                placeholder="دج"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("settings.storeAddress")}</Label>
            <Input
              value={formData.store_address ?? ""}
              onChange={(e) => handleChange("store_address", e.target.value)}
              placeholder="عنوان المتجر"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("settings.invoiceFooter")}</Label>
            <Input
              value={formData.invoice_footer ?? ""}
              onChange={(e) => handleChange("invoice_footer", e.target.value)}
              placeholder="شكراً لتسوقكم معنا"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("settings.lowStockThreshold")}</Label>
            <Input
              type="number"
              value={formData.low_stock_threshold ?? "5"}
              onChange={(e) => handleChange("low_stock_threshold", e.target.value)}
              className="ltr w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">المظهر واللغة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("settings.theme")}</Label>
            <div className="flex gap-3">
              <button
                onClick={() => handleThemeChange("dark")}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  theme === "dark"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Moon className="w-4 h-4" />
                <span className="text-sm">{t("settings.darkMode")}</span>
              </button>
              <button
                onClick={() => handleThemeChange("light")}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  theme === "light"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Sun className="w-4 h-4" />
                <span className="text-sm">{t("settings.lightMode")}</span>
              </button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t("settings.language")}
            </Label>
            <Select value={language} onValueChange={(v) => handleLanguageChange(v as "ar" | "fr" | "en")}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية 🇩🇿</SelectItem>
                <SelectItem value="fr">Français 🇫🇷</SelectItem>
                <SelectItem value="en">English 🇬🇧</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button
        className="gap-2"
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        <Save className="w-4 h-4" />
        {saveMutation.isPending ? "جاري الحفظ..." : t("settings.save")}
      </Button>
    </div>
  );
}
