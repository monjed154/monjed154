import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, DollarSign, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { db } from "@/services/tauriBridge";
import { formatCurrency } from "@/utils/format";
import type { Debt } from "@/types";

function PaymentDialog({
  debt,
  onClose,
  onSuccess,
}: {
  debt: Debt;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const pay = parseFloat(amount);
      if (isNaN(pay) || pay <= 0) throw new Error("أدخل مبلغاً صالحاً");
      if (pay > debt.remaining) throw new Error("المبلغ أكبر من الدين المتبقي");
      return db.addDebtPayment({
        debt_id: debt.id,
        customer_id: debt.customer_id,
        amount: pay,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة");
      onSuccess();
    },
    onError: (e) => toast.error(String(e)),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة — {debt.customer_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">إجمالي الدين</span>
              <span className="ltr font-bold">{formatCurrency(debt.amount)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">المدفوع</span>
              <span className="ltr text-emerald-500">{formatCurrency(debt.paid_amount)}</span>
            </div>
            <div className="flex justify-between mt-1 border-t pt-1">
              <span>المتبقي</span>
              <span className="ltr font-bold text-yellow-500">{formatCurrency(debt.remaining)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>مبلغ الدفعة *</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="ltr flex-1"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(String(debt.remaining))}
              >
                كامل
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>ملاحظات</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات اختيارية..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!amount || mutation.isPending}
            variant="success"
          >
            {mutation.isPending ? "جاري الحفظ..." : "تسجيل الدفعة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Debts() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payDebt, setPayDebt] = useState<Debt | null>(null);

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ["debts", search, statusFilter],
    queryFn: () =>
      db.getDebts(
        search || undefined,
        statusFilter !== "all" ? statusFilter : undefined
      ),
  });

  const totalDebt = debts
    .filter((d) => d.status !== "PAID")
    .reduce((sum, d) => sum + d.remaining, 0);

  const uniqueCustomers = new Set(debts.filter((d) => d.status !== "PAID").map((d) => d.customer_id)).size;

  const getStatusBadge = (status: Debt["status"]) => {
    const map = {
      PENDING: { label: "معلق", variant: "warning" as const },
      PARTIAL: { label: "جزئي", variant: "info" as const },
      PAID: { label: "محصّل", variant: "success" as const },
      CANCELLED: { label: "ملغى", variant: "secondary" as const },
    };
    const { label, variant } = map[status] ?? map.PENDING;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("debts.title")}</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الديون</p>
              <p className="text-xl font-bold ltr">{formatCurrency(totalDebt)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">عدد العملاء</p>
              <p className="text-xl font-bold">{uniqueCustomers} عميل</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("debts.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="PENDING">معلق</SelectItem>
              <SelectItem value="PARTIAL">جزئي</SelectItem>
              <SelectItem value="PAID">محصّل</SelectItem>
            </SelectContent>
          </Select>
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
                    <th className="text-right px-4 py-3 font-medium">العميل</th>
                    <th className="text-right px-4 py-3 font-medium hidden md:table-cell">الفاتورة</th>
                    <th className="text-right px-4 py-3 font-medium">الدين</th>
                    <th className="text-right px-4 py-3 font-medium">المدفوع</th>
                    <th className="text-right px-4 py-3 font-medium">المتبقي</th>
                    <th className="text-right px-4 py-3 font-medium">الحالة</th>
                    <th className="text-right px-4 py-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {debts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        {t("common.noData")}
                      </td>
                    </tr>
                  ) : (
                    debts.map((debt) => (
                      <tr key={debt.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="font-medium">{debt.customer_name}</p>
                          {debt.customer_phone && (
                            <p className="text-xs text-muted-foreground ltr">{debt.customer_phone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell font-mono text-xs ltr">
                          {debt.invoice_number ?? "—"}
                        </td>
                        <td className="px-4 py-3 ltr">{formatCurrency(debt.amount)}</td>
                        <td className="px-4 py-3 ltr text-emerald-500">{formatCurrency(debt.paid_amount)}</td>
                        <td className="px-4 py-3 ltr font-bold text-yellow-500">{formatCurrency(debt.remaining)}</td>
                        <td className="px-4 py-3">{getStatusBadge(debt.status)}</td>
                        <td className="px-4 py-3">
                          {debt.status !== "PAID" && debt.status !== "CANCELLED" && (
                            <Button
                              size="sm"
                              variant="success"
                              className="gap-1"
                              onClick={() => setPayDebt(debt)}
                            >
                              <DollarSign className="w-3 h-3" />
                              سداد
                            </Button>
                          )}
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

      {payDebt && (
        <PaymentDialog
          debt={payDebt}
          onClose={() => setPayDebt(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["debts"] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            setPayDebt(null);
          }}
        />
      )}
    </div>
  );
}
