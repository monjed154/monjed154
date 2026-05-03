import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Package, ShoppingCart, Users, CreditCard,
  BarChart3, Settings, Store, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "nav.dashboard" },
  { path: "/inventory", icon: Package, label: "nav.inventory" },
  { path: "/pos", icon: ShoppingCart, label: "nav.pos" },
  { path: "/sales", icon: TrendingUp, label: "nav.sales" },
  { path: "/customers", icon: Users, label: "nav.customers" },
  { path: "/debts", icon: CreditCard, label: "nav.debts" },
  { path: "/reports", icon: BarChart3, label: "nav.reports" },
  { path: "/settings", icon: Settings, label: "nav.settings" },
];

export function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="w-56 flex-shrink-0 border-l bg-card flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-base leading-none">{t("app.name")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">StockFlow</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-1 px-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {t(label)}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-3 border-t">
        <p className="text-xs text-muted-foreground text-center">
          مخزني v1.0.0
        </p>
      </div>
    </aside>
  );
}
