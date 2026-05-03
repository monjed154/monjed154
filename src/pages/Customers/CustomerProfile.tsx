import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/services/tauriBridge";
import { formatCurrency, formatDateTime } from "@/utils/format";
import type { Customer } from "@/types";

interface Props {
  customer: Customer;
  onClose: () => void;
}

export function CustomerProfile({ customer, onClose }: Props) {
  const { data: debts = [] } = useQuery({
    queryKey: ["customer-debts", customer.id],
    queryFn: () => db.getCustomerDebts(customer.id),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["sales", "", "", ""],
    queryFn: () => db.getSales(),
    select: (data) => data.filter((s) => s.customer_id === customer.id),
  });

  const totalDebt = debts
    .filter((d) => d.status !== "PAID" && d.status !== "CANCELLED")
    .reduce((sum, d) => sum + d.remaining, 0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{customer.name}</span>
            {totalDebt > 0 ? (
              <Badge variant="warning">مديون: {formatCurrency(totalDebt)}</Badge>
            ) : (
              <Badge variant="success">لا ديون</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {customer.phone && (
              <div>
                <p className="text-muted-foreground">الهاتف</p>
                <p className="ltr">{customer.phone}</p>
              </div>
            )}
            {customer.address && (
              <div>
                <p className="text-muted-foreground">العنوان</p>
                <p>{customer.address}</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <Tabs defaultValue="debts" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="debts" className="flex-1">الديون ({debts.length})</TabsTrigger>
            <TabsTrigger value="sales" className="flex-1">المبيعات ({sales.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="debts" className="flex-1 overflow-auto mt-3">
            {debts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد ديون</p>
            ) : (
              <div className="space-y-2">
                {debts.map((debt) => (
                  <div key={debt.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{debt.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(debt.created_at)}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold ltr text-yellow-500">{formatCurrency(debt.remaining)}</p>
                      <Badge variant={
                        debt.status === "PAID" ? "success" :
                        debt.status === "PARTIAL" ? "info" : "warning"
                      } className="text-xs">
                        {debt.status === "PAID" ? "محصّل" : debt.status === "PARTIAL" ? "جزئي" : "معلق"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sales" className="flex-1 overflow-auto mt-3">
            {sales.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد مبيعات</p>
            ) : (
              <div className="space-y-2">
                {sales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-mono ltr">{sale.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(sale.created_at)}</p>
                    </div>
                    <p className="font-bold ltr">{formatCurrency(sale.total_amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
