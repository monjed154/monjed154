import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Eye, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { db } from "@/services/tauriBridge";
import { formatCurrency, formatDateTime } from "@/utils/format";
import type { Sale } from "@/types";
import { SaleDetailDialog } from "./SaleDetailDialog";

export default function Sales() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [cancelSale, setCancelSale] = useState<Sale | null>(null);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales", search],
    queryFn: () => db.getSales(search || undefined),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => db.cancelSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("تم إلغاء الفاتورة وإعادة المخزون");
      setCancelSale(null);
    },
    onError: (e) => toast.error(String(e)),
  });

  const getStatusBadge = (status: Sale["status"]) => {
    const variants = {
      COMPLETED: "success" as const,
      CANCELLED: "secondary" as const,
      REFUNDED: "warning" as const,
    };
    const labels = { COMPLETED: "مكتملة", CANCELLED: "ملغاة", REFUNDED: "مرتجعة" };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getPaymentBadge = (method: Sale["payment_method"]) => {
    const labels = { CASH: "نقداً", DEBT: "آجل", PARTIAL: "جزئي" };
    const variants = {
      CASH: "success" as const,
      DEBT: "warning" as const,
      PARTIAL: "info" as const,
    };
    return <Badge variant={variants[method]}>{labels[method]}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("sales.title")}</h1>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الفاتورة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground">{t("common.loading")}</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-right px-4 py-3 font-medium">رقم الفاتورة</th>
                    <th className="text-right px-4 py-3 font-medium hidden md:table-cell">العميل</th>
                    <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">التاريخ</th>
                    <th className="text-right px-4 py-3 font-medium">الإجمالي</th>
                    <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">الدفع</th>
                    <th className="text-right px-4 py-3 font-medium">الحالة</th>
                    <th className="text-right px-4 py-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        {t("common.noData")}
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-sm ltr">{sale.invoice_number}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {sale.customer_name ?? <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">
                          {formatDateTime(sale.created_at)}
                        </td>
                        <td className="px-4 py-3 font-bold ltr">{formatCurrency(sale.total_amount)}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {getPaymentBadge(sale.payment_method)}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(sale.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewSale(sale)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {sale.status === "COMPLETED" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setCancelSale(sale)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {viewSale && (
        <SaleDetailDialog sale={viewSale} onClose={() => setViewSale(null)} />
      )}

      <AlertDialog open={!!cancelSale} onOpenChange={() => setCancelSale(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء الفاتورة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء الفاتورة {cancelSale?.invoice_number}؟
              سيتم إعادة المخزون تلقائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => cancelSale && cancelMutation.mutate(cancelSale.id)}
            >
              إلغاء الفاتورة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
