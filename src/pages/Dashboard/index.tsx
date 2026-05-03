import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, Package, CreditCard, DollarSign,
  AlertTriangle, Activity, BarChart2,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/services/tauriBridge";
import { formatCurrency, formatDate } from "@/utils/format";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "warning" | "danger" | "success";
}) {
  const colors = {
    default: "text-primary bg-primary/10",
    warning: "text-yellow-500 bg-yellow-500/10",
    danger: "text-red-500 bg-red-500/10",
    success: "text-emerald-500 bg-emerald-500/10",
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1 ltr">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[variant]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: db.getDashboardStats,
    refetchInterval: 30000,
  });

  const { data: chartData = [] } = useQuery({
    queryKey: ["sales-chart", 30],
    queryFn: () => db.getSalesChart(30),
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ["top-products", 30],
    queryFn: () => db.getTopProducts(30),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-low"],
    queryFn: () => db.getProducts(undefined, undefined, "low"),
  });

  const outOfStock = products.filter((p) => p.quantity <= 0);
  const lowStockProducts = products.filter((p) => p.quantity > 0 && p.quantity <= p.min_quantity);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  const formattedChartData = chartData.map((d) => ({
    ...d,
    date: formatDate(d.date).split(" ").slice(0, 2).join(" "),
  }));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.welcome")} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {formatDate(new Date().toISOString())}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title={t("dashboard.todaySales")}
          value={formatCurrency(stats?.today_sales ?? 0)}
          subtitle={`${stats?.today_sales_count ?? 0} فاتورة`}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title={t("dashboard.todayProfit")}
          value={formatCurrency(stats?.today_profit ?? 0)}
          icon={TrendingUp}
          variant="default"
        />
        <StatCard
          title={t("dashboard.totalDebts")}
          value={formatCurrency(stats?.total_debt ?? 0)}
          subtitle={`${stats?.debt_customers_count ?? 0} ${t("dashboard.customers")}`}
          icon={CreditCard}
          variant="warning"
        />
        <StatCard
          title={t("dashboard.lowStock")}
          value={String(stats?.low_stock_count ?? 0)}
          subtitle={`نفد: ${stats?.out_of_stock_count ?? 0}`}
          icon={Package}
          variant="danger"
        />
        <StatCard
          title={t("dashboard.todayMovements")}
          value={String(stats?.today_movements ?? 0)}
          icon={Activity}
          variant="default"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Sales Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart2 className="w-4 h-4 text-primary" />
              {t("dashboard.salesChart")} (آخر 30 يوم)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={formattedChartData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), ""]}
                  labelStyle={{ direction: "rtl" }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="المبيعات"
                  stroke="#10b981"
                  fill="url(#salesGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="الأرباح"
                  stroke="#3b82f6"
                  fill="none"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-primary" />
              أكثر السلع مبيعاً
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("common.noData")}
              </p>
            ) : (
              topProducts.slice(0, 6).map((p, i) => (
                <div key={p.product_id} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm truncate">{p.product_name}</span>
                  <span className="text-xs text-muted-foreground ltr">{p.total_quantity} وحدة</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {(outOfStock.length > 0 || lowStockProducts.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-yellow-500">
              <AlertTriangle className="w-4 h-4" />
              {t("dashboard.lowStockAlerts")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {outOfStock.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-1">
                  <Badge variant="destructive">نفد</Badge>
                  <span className="flex-1 text-sm">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    الكمية: <span className="ltr text-destructive font-bold">0</span>
                  </span>
                </div>
              ))}
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-1">
                  <Badge variant="warning">منخفض</Badge>
                  <span className="flex-1 text-sm">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    الكمية: <span className="ltr text-yellow-500 font-bold">{p.quantity}</span>
                    {" "}(الحد: {p.min_quantity})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
