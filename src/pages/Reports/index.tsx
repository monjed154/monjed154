import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/services/tauriBridge";
import { formatCurrency, formatDate } from "@/utils/format";

const PERIODS = [
  { label: "اليوم", days: 1 },
  { label: "7 أيام", days: 7 },
  { label: "30 يوم", days: 30 },
  { label: "90 يوم", days: 90 },
];

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#6b7280"];

export default function Reports() {
  const { t } = useTranslation();
  const [days, setDays] = useState(30);

  const { data: chartData = [] } = useQuery({
    queryKey: ["sales-chart", days],
    queryFn: () => db.getSalesChart(days),
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ["top-products", days],
    queryFn: () => db.getTopProducts(days),
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: db.getDashboardStats,
  });

  const totalSales = chartData.reduce((sum, d) => sum + d.sales, 0);
  const totalProfit = chartData.reduce((sum, d) => sum + d.profit, 0);
  const totalOrders = chartData.reduce((sum, d) => sum + d.count, 0);
  const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : "0";

  const formattedChart = chartData.map((d) => ({
    ...d,
    date: formatDate(d.date).split(" ").slice(0, 2).join(" "),
  }));

  const pieData = topProducts.slice(0, 6).map((p) => ({
    name: p.product_name.length > 12 ? p.product_name.slice(0, 12) + "..." : p.product_name,
    value: p.total_quantity,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("reports.title")}</h1>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.days}
              variant={days === p.days ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(p.days)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
            <p className="text-xl font-bold ltr mt-1">{formatCurrency(totalSales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي الأرباح</p>
            <p className="text-xl font-bold ltr mt-1 text-emerald-500">{formatCurrency(totalProfit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">هامش الربح</p>
            <p className="text-xl font-bold ltr mt-1">{profitMargin}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">عدد الفواتير</p>
            <p className="text-xl font-bold mt-1">{totalOrders}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">المبيعات</TabsTrigger>
          <TabsTrigger value="products">أفضل المنتجات</TabsTrigger>
          <TabsTrigger value="inventory">المخزون</TabsTrigger>
        </TabsList>

        {/* Sales Chart */}
        <TabsContent value="sales" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">مبيعات وأرباح آخر {days} يوم</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  لا توجد بيانات
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={formattedChart}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [formatCurrency(Number(v)), ""]} />
                    <Legend />
                    <Bar dataKey="sales" name="المبيعات" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="الأرباح" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Products */}
        <TabsContent value="products" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">توزيع المبيعات حسب السلعة</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">لا توجد بيانات</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">أفضل 10 سلع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {topProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
                ) : (
                  topProducts.map((p, i) => (
                    <div key={p.product_id} className="flex items-center gap-3">
                      <span
                        className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm truncate">{p.product_name}</span>
                      <div className="text-left text-xs text-muted-foreground">
                        <p className="ltr font-medium text-foreground">{formatCurrency(p.total_revenue)}</p>
                        <p className="ltr">{p.total_quantity} وحدة</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Report */}
        <TabsContent value="inventory" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">إجمالي السلع</p>
                <p className="text-2xl font-bold mt-1">{stats?.total_products ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">قيمة المخزون</p>
                <p className="text-xl font-bold ltr mt-1">{formatCurrency(stats?.total_inventory_value ?? 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">سلع نفدت</p>
                <p className="text-2xl font-bold mt-1 text-destructive">{stats?.out_of_stock_count ?? 0}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
