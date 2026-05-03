import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Minus, Trash2, ShoppingCart, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { db } from "@/services/tauriBridge";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency } from "@/utils/format";
import type { Product, CartItem } from "@/types";

export default function POS() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [lastSaleInvoice, setLastSaleInvoice] = useState<string | null>(null);

  const cart = useCartStore();

  const { data: products = [] } = useQuery({
    queryKey: ["products-pos", productSearch],
    queryFn: () => db.getProducts(productSearch || undefined),
    enabled: productSearch.length > 0,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-pos", customerSearch],
    queryFn: () => db.getCustomers(customerSearch || undefined),
    enabled: customerSearch.length > 0,
  });

  const createSaleMutation = useMutation({
    mutationFn: () => {
      if (cart.items.length === 0) throw new Error("السلة فارغة");
      if (cart.paymentMethod !== "CASH" && !cart.customer) {
        throw new Error("يجب اختيار عميل للبيع الآجل أو الجزئي");
      }
      return db.createSale({
        customer_id: cart.customer?.id,
        subtotal: cart.subtotal(),
        discount_type: cart.discountType,
        discount_value: cart.discountValue,
        discount_amount: cart.discountAmount(),
        total_amount: cart.total(),
        paid_amount:
          cart.paymentMethod === "CASH"
            ? cart.total()
            : cart.paymentMethod === "DEBT"
            ? 0
            : cart.paidAmount,
        debt_amount: cart.debtAmount(),
        payment_method: cart.paymentMethod,
        notes: cart.notes || undefined,
        items: cart.items.map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          purchase_price: i.purchase_price,
          discount: i.discount,
          total: i.total,
        })),
      });
    },
    onSuccess: (sale) => {
      setLastSaleInvoice(sale.invoice_number);
      cart.clearCart();
      setProductSearch("");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast.success(`تم تسجيل الفاتورة ${sale.invoice_number}`);
      searchRef.current?.focus();
    },
    onError: (e) => toast.error(String(e)),
  });

  const addProductToCart = useCallback((product: Product) => {
    if (product.quantity <= 0) {
      toast.error("هذه السلعة غير متوفرة في المخزون");
      return;
    }
    const item: CartItem = {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price: product.selling_price,
      purchase_price: product.purchase_price,
      discount: 0,
      total: product.selling_price,
      unit: product.unit,
      max_quantity: product.quantity,
    };
    cart.addItem(item);
    setProductSearch("");
    searchRef.current?.focus();
  }, [cart]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && products.length === 1) {
        addProductToCart(products[0]);
      }
    },
    [products, addProductToCart]
  );

  const handleProductLookup = useCallback(async () => {
    if (!productSearch.trim()) return;
    try {
      const product = await db.getProductByBarcode(productSearch.trim());
      if (product) {
        addProductToCart(product);
        return;
      }
    } catch {}
    if (products.length === 1) {
      addProductToCart(products[0]);
    }
  }, [productSearch, products, addProductToCart]);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Left: Product Search */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">{t("nav.pos")}</h1>
          {lastSaleInvoice && (
            <Badge variant="success">
              <Check className="w-3 h-3 ml-1" />
              آخر فاتورة: {lastSaleInvoice}
            </Badge>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder={t("sales.searchProduct")}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pr-10 h-11 text-base"
              autoFocus
            />
          </div>
          <Button onClick={handleProductLookup} className="h-11 px-6">
            بحث
          </Button>
        </div>

        {/* Search Results */}
        {productSearch && (
          <Card className="flex-1 overflow-hidden">
            <CardHeader className="py-2 px-4 border-b">
              <CardTitle className="text-sm text-muted-foreground">
                نتائج البحث ({products.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto max-h-[400px]">
              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <p>لا توجد نتائج</p>
                </div>
              ) : (
                <div className="divide-y">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-right transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => addProductToCart(product)}
                      disabled={product.quantity <= 0}
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">📦</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.category_name && `${product.category_name} · `}
                          متبقي:{" "}
                          <span className={product.quantity <= product.min_quantity ? "text-yellow-500" : ""}>
                            {product.quantity}
                          </span>{" "}
                          {product.unit}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold ltr">{formatCurrency(product.selling_price)}</p>
                        {product.quantity <= 0 && (
                          <Badge variant="destructive" className="text-xs">نفد</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!productSearch && (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>ابحث عن سلعة أو امسح الباركود</p>
            </div>
          </Card>
        )}
      </div>

      {/* Right: Cart + Payment */}
      <div className="w-80 flex flex-col gap-3 flex-shrink-0">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                {t("sales.cart")}
              </span>
              {cart.items.length > 0 && (
                <button
                  onClick={() => cart.clearCart()}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </CardTitle>
          </CardHeader>

          {/* Cart Items */}
          <div className="flex-1 overflow-auto">
            {cart.items.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                {t("sales.emptyCart")}
              </div>
            ) : (
              <div className="divide-y">
                {cart.items.map((item) => (
                  <div key={item.product_id} className="px-3 py-2">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-medium flex-1 truncate">{item.product_name}</p>
                      <button
                        onClick={() => cart.removeItem(item.product_id)}
                        className="text-muted-foreground hover:text-destructive p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            item.quantity > 1
                              ? cart.updateQuantity(item.product_id, item.quantity - 1)
                              : cart.removeItem(item.product_id)
                          }
                          className="w-6 h-6 rounded border flex items-center justify-center hover:bg-accent"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold ltr">{item.quantity}</span>
                        <button
                          onClick={() =>
                            cart.updateQuantity(
                              item.product_id,
                              Math.min(item.quantity + 1, item.max_quantity)
                            )
                          }
                          className="w-6 h-6 rounded border flex items-center justify-center hover:bg-accent"
                          disabled={item.quantity >= item.max_quantity}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold ltr">{formatCurrency(item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.items.length > 0 && (
            <div className="border-t p-3 space-y-2">
              {/* Discount */}
              <div className="flex gap-2 items-center">
                <Select
                  value={cart.discountType}
                  onValueChange={(v) => cart.setDiscountType(v as "AMOUNT" | "PERCENT")}
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMOUNT">مبلغ</SelectItem>
                    <SelectItem value="PERCENT">نسبة %</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex-1 relative">
                  <Input
                    type="number"
                    value={cart.discountValue || ""}
                    onChange={(e) => cart.setDiscountValue(Number(e.target.value))}
                    placeholder="الخصم"
                    className="h-8 text-sm ltr"
                  />
                </div>
              </div>

              {/* Subtotal */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>المجموع</span>
                  <span className="ltr">{formatCurrency(cart.subtotal())}</span>
                </div>
                {cart.discountAmount() > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>الخصم</span>
                    <span className="ltr">- {formatCurrency(cart.discountAmount())}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-1">
                  <span>الإجمالي</span>
                  <span className="ltr">{formatCurrency(cart.total())}</span>
                </div>
              </div>

              <Separator />

              {/* Customer */}
              <div className="space-y-1">
                <Label className="text-xs">العميل</Label>
                {cart.customer ? (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-sm font-medium truncate">{cart.customer.name}</span>
                    <button
                      onClick={() => cart.setCustomer(undefined)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerSearch(true);
                      }}
                      placeholder="بحث عن عميل..."
                      className="h-8 text-xs"
                    />
                    {showCustomerSearch && customerSearch && customers.length > 0 && (
                      <div className="absolute bottom-full mb-1 w-full bg-popover border rounded shadow-lg z-50 max-h-32 overflow-auto">
                        {customers.map((c) => (
                          <button
                            key={c.id}
                            className="w-full px-3 py-1.5 text-right text-sm hover:bg-accent"
                            onClick={() => {
                              cart.setCustomer(c);
                              setCustomerSearch("");
                              setShowCustomerSearch(false);
                            }}
                          >
                            <p>{c.name}</p>
                            {c.phone && <p className="text-xs text-muted-foreground ltr">{c.phone}</p>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="grid grid-cols-3 gap-1">
                {(["CASH", "DEBT", "PARTIAL"] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => cart.setPaymentMethod(method)}
                    className={`py-1.5 rounded text-xs font-medium border transition-colors ${
                      cart.paymentMethod === method
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {method === "CASH" ? "نقداً" : method === "DEBT" ? "آجل" : "جزئي"}
                  </button>
                ))}
              </div>

              {/* Paid Amount for Partial */}
              {cart.paymentMethod === "PARTIAL" && (
                <div>
                  <Label className="text-xs">المبلغ المدفوع</Label>
                  <Input
                    type="number"
                    value={cart.paidAmount || ""}
                    onChange={(e) => cart.setPaidAmount(Number(e.target.value))}
                    className="h-8 text-sm ltr"
                    placeholder="0"
                  />
                  {cart.debtAmount() > 0 && (
                    <p className="text-xs text-yellow-500 mt-1">
                      الدين: {formatCurrency(cart.debtAmount())}
                    </p>
                  )}
                </div>
              )}

              {/* Confirm Button */}
              <Button
                className="w-full h-11 text-base gap-2"
                onClick={() => createSaleMutation.mutate()}
                disabled={cart.items.length === 0 || createSaleMutation.isPending}
              >
                <Check className="w-5 h-5" />
                {createSaleMutation.isPending ? "جاري الحفظ..." : t("sales.confirmSale")}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
