import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, RefreshCw, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { db } from "@/services/tauriBridge";
import { formatCurrency } from "@/utils/format";
import type { Product } from "@/types";
import { ProductForm } from "./ProductForm";
import { StockAdjustDialog } from "./StockAdjustDialog";

export default function Inventory() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: db.getCategories,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", search, categoryFilter, stockFilter],
    queryFn: () =>
      db.getProducts(
        search || undefined,
        categoryFilter !== "all" ? Number(categoryFilter) : undefined,
        stockFilter !== "all" ? stockFilter : undefined
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => db.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم حذف السلعة بنجاح");
      setDeleteProduct(null);
    },
    onError: (e) => toast.error(String(e)),
  });

  const totalValue = products.reduce(
    (sum, p) => sum + p.purchase_price * p.quantity,
    0
  );

  const getStockBadge = (product: Product) => {
    if (product.quantity <= 0) return <Badge variant="destructive">نفد</Badge>;
    if (product.quantity <= product.min_quantity)
      return <Badge variant="warning">منخفض</Badge>;
    return <Badge variant="success">متوفر</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("inventory.title")}</h1>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t("inventory.addProduct")}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("inventory.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t("inventory.allCategories")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("inventory.allCategories")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t("inventory.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("inventory.all")}</SelectItem>
                <SelectItem value="low">{t("inventory.lowStock")}</SelectItem>
                <SelectItem value="out">{t("inventory.outOfStock")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {t("inventory.totalProducts")}: <strong className="text-foreground">{products.length}</strong> سلعة
        </span>
        <span>
          {t("inventory.totalValue")}: <strong className="text-foreground">{formatCurrency(totalValue)}</strong>
        </span>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          {t("common.loading")}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <PackageOpen className="w-12 h-12 text-muted-foreground mb-3" />
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
                    <th className="text-right px-4 py-3 font-medium">{t("inventory.product")}</th>
                    <th className="text-right px-4 py-3 font-medium hidden md:table-cell">{t("inventory.category")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("inventory.quantity")}</th>
                    <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">{t("inventory.purchasePrice")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("inventory.sellingPrice")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("inventory.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.barcode && (
                            <p className="text-xs text-muted-foreground ltr">{product.barcode}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          {product.category_name ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold ltr">{product.quantity} {product.unit}</span>
                          {getStockBadge(product)}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground ltr">
                        {formatCurrency(product.purchase_price)}
                      </td>
                      <td className="px-4 py-3 font-medium ltr">
                        {formatCurrency(product.selling_price)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setAdjustProduct(product)}
                            title="تعديل المخزون"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditProduct(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteProduct(product)}
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

      {/* Product Form Dialog */}
      {(showAddForm || editProduct) && (
        <ProductForm
          product={editProduct}
          categories={categories}
          onClose={() => {
            setShowAddForm(false);
            setEditProduct(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setShowAddForm(false);
            setEditProduct(null);
          }}
        />
      )}

      {/* Stock Adjust Dialog */}
      {adjustProduct && (
        <StockAdjustDialog
          product={adjustProduct}
          onClose={() => setAdjustProduct(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setAdjustProduct(null);
          }}
        />
      )}

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف السلعة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف &quot;{deleteProduct?.name}&quot;؟ لن يتم حذف بيانات المبيعات القديمة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteProduct && deleteMutation.mutate(deleteProduct.id)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
