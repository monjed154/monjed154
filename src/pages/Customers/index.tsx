import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Eye, Users } from "lucide-react";
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
import { formatCurrency } from "@/utils/format";
import type { Customer } from "@/types";
import { CustomerForm } from "./CustomerForm";
import { CustomerProfile } from "./CustomerProfile";

export default function Customers() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => db.getCustomers(search || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => db.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("تم حذف العميل");
      setDeleteCustomer(null);
    },
    onError: (e) => toast.error(String(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("customers.title")}</h1>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t("customers.addCustomer")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("customers.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground">{t("common.loading")}</div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{t("common.noData")}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-right px-4 py-3 font-medium">العميل</th>
                    <th className="text-right px-4 py-3 font-medium hidden md:table-cell">رقم الهاتف</th>
                    <th className="text-right px-4 py-3 font-medium">الرصيد</th>
                    <th className="text-right px-4 py-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          {customer.address && (
                            <p className="text-xs text-muted-foreground">{customer.address}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell ltr text-muted-foreground">
                        {customer.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {customer.balance < 0 ? (
                          <div>
                            <Badge variant="warning">مديون</Badge>
                            <p className="text-xs text-yellow-500 font-bold ltr mt-0.5">
                              {formatCurrency(Math.abs(customer.balance))}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="success">لا ديون</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewCustomer(customer)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditCustomer(customer)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteCustomer(customer)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {(showAdd || editCustomer) && (
        <CustomerForm
          customer={editCustomer}
          onClose={() => { setShowAdd(false); setEditCustomer(null); }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            setShowAdd(false);
            setEditCustomer(null);
          }}
        />
      )}

      {viewCustomer && (
        <CustomerProfile
          customer={viewCustomer}
          onClose={() => setViewCustomer(null)}
        />
      )}

      <AlertDialog open={!!deleteCustomer} onOpenChange={() => setDeleteCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف العميل</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف العميل &quot;{deleteCustomer?.name}&quot;؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteCustomer && deleteMutation.mutate(deleteCustomer.id)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
