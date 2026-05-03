import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { db } from "@/services/tauriBridge";
import { formatCurrency, formatDateTime } from "@/utils/format";
import type { Sale } from "@/types";

interface Props {
  sale: Sale;
  onClose: () => void;
}

export function SaleDetailDialog({ sale, onClose }: Props) {
  const { data: fullSale } = useQuery({
    queryKey: ["sale", sale.id],
    queryFn: () => db.getSale(sale.id),
  });

  const items = fullSale?.items ?? [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>فاتورة</span>
            <span className="font-mono ltr">{sale.invoice_number}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">التاريخ</p>
              <p>{formatDateTime(sale.created_at)}</p>
            </div>
            {sale.customer_name && (
              <div>
                <p className="text-muted-foreground">العميل</p>
                <p>{sale.customer_name}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-2">
            <p className="text-sm font-medium">البنود</p>
            <div className="space-y-1">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <span>{item.product_name}</span>
                    <span className="text-muted-foreground mx-2">×</span>
                    <span className="ltr">{item.quantity}</span>
                  </div>
                  <span className="ltr font-medium">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">المجموع الفرعي</span>
              <span className="ltr">{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-destructive">
                <span>الخصم</span>
                <span className="ltr">- {formatCurrency(sale.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base">
              <span>الإجمالي</span>
              <span className="ltr">{formatCurrency(sale.total_amount)}</span>
            </div>
            {sale.paid_amount < sale.total_amount && (
              <>
                <div className="flex justify-between text-emerald-500">
                  <span>المدفوع</span>
                  <span className="ltr">{formatCurrency(sale.paid_amount)}</span>
                </div>
                <div className="flex justify-between text-yellow-500">
                  <span>الدين</span>
                  <span className="ltr">{formatCurrency(sale.debt_amount)}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between items-center">
            <Badge variant={sale.status === "COMPLETED" ? "success" : "secondary"}>
              {sale.status === "COMPLETED" ? "مكتملة" : "ملغاة"}
            </Badge>
            <Badge variant={sale.payment_method === "CASH" ? "success" : "warning"}>
              {sale.payment_method === "CASH" ? "نقداً" : sale.payment_method === "DEBT" ? "آجل" : "جزئي"}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
