import { Bell, Moon, Sun, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/stores/settingsStore";
import { db } from "@/services/tauriBridge";
import { formatDate } from "@/utils/format";

export function Header() {
  const { t } = useTranslation();
  const { theme, setTheme } = useSettingsStore();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: db.getDashboardStats,
    refetchInterval: 60000,
  });

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const lowStockAlerts = (stats?.low_stock_count ?? 0) + (stats?.out_of_stock_count ?? 0);

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {formatDate(new Date().toISOString())}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {lowStockAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
              {lowStockAlerts > 9 ? "9+" : lowStockAlerts}
            </span>
          )}
        </Button>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        {/* User */}
        <Button variant="ghost" size="sm" className="gap-2">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm">{t("common.admin", { defaultValue: "المدير" })}</span>
        </Button>
      </div>
    </header>
  );
}
