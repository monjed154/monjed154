import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { db } from "@/services/tauriBridge";
import type { Product, Category } from "@/types";

const schema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  barcode: z.string().optional(),
  description: z.string().optional(),
  category_id: z.string().optional(),
  unit: z.string().min(1, "الوحدة مطلوبة"),
  purchase_price: z.coerce.number().min(0),
  selling_price: z.coerce.number().min(0),
  quantity: z.coerce.number().min(0),
  min_quantity: z.coerce.number().min(0),
});

type FormData = z.infer<typeof schema>;

const UNITS = ["قطعة", "كيلو", "لتر", "علبة", "عبوة", "دزينة", "طن", "متر"];

interface Props {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductForm({ product, categories, onClose, onSuccess }: Props) {
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: product
      ? {
          name: product.name,
          barcode: product.barcode ?? "",
          description: product.description ?? "",
          category_id: product.category_id ? String(product.category_id) : undefined,
          unit: product.unit,
          purchase_price: product.purchase_price,
          selling_price: product.selling_price,
          quantity: product.quantity,
          min_quantity: product.min_quantity,
        }
      : { unit: "قطعة", quantity: 0, min_quantity: 5 },
  });

  const purchasePrice = watch("purchase_price") as number;
  const sellingPrice = watch("selling_price") as number;
  const profitMargin =
    purchasePrice > 0
      ? (((sellingPrice - purchasePrice) / purchasePrice) * 100).toFixed(1)
      : "0";

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        name: data.name,
        barcode: data.barcode || undefined,
        description: data.description || undefined,
        category_id: data.category_id ? Number(data.category_id) : undefined,
        unit: data.unit,
        purchase_price: data.purchase_price,
        selling_price: data.selling_price,
        quantity: data.quantity,
        min_quantity: data.min_quantity,
      };
      if (isEdit && product) {
        await db.updateProduct({ id: product.id, ...payload });
        return 0;
      }
      return db.addProduct(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "تم تحديث السلعة" : "تمت إضافة السلعة");
      onSuccess();
    },
    onError: (e) => toast.error(String(e)),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل سلعة" : "إضافة سلعة جديدة"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d as unknown as FormData))}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">اسم السلعة *</Label>
              <Input id="name" {...register("name")} placeholder="أدخل اسم السلعة" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {/* Barcode */}
            <div className="space-y-1.5">
              <Label htmlFor="barcode">الباركود</Label>
              <Input id="barcode" {...register("barcode")} placeholder="123456789" className="ltr" />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>الفئة</Label>
              <Select
                defaultValue={product?.category_id ? String(product.category_id) : undefined}
                onValueChange={(v) => setValue("category_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <Label>وحدة القياس *</Label>
              <Select
                defaultValue={product?.unit ?? "قطعة"}
                onValueChange={(v) => setValue("unit", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="desc">الوصف</Label>
              <Input id="desc" {...register("description")} placeholder="وصف اختياري" />
            </div>
          </div>

          {/* Pricing Section */}
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">التسعير</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pp">سعر الشراء *</Label>
                <div className="relative">
                  <Input
                    id="pp"
                    type="number"
                    step="0.01"
                    {...register("purchase_price")}
                    className="ltr pl-8"
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">دج</span>
                </div>
                {errors.purchase_price && <p className="text-xs text-destructive">{errors.purchase_price.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sp">سعر البيع *</Label>
                <div className="relative">
                  <Input
                    id="sp"
                    type="number"
                    step="0.01"
                    {...register("selling_price")}
                    className="ltr pl-8"
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">دج</span>
                </div>
                {errors.selling_price && <p className="text-xs text-destructive">{errors.selling_price.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>هامش الربح</Label>
                <div className="h-9 flex items-center px-3 rounded-md border bg-muted text-sm font-medium ltr">
                  {profitMargin}%
                </div>
              </div>
            </div>
          </div>

          {/* Stock Section */}
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">المخزون</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="qty">{isEdit ? "الكمية الحالية" : "الكمية الأولية"} *</Label>
                <Input
                  id="qty"
                  type="number"
                  step="0.01"
                  {...register("quantity")}
                  className={`ltr ${isEdit ? "bg-muted" : ""}`}
                  readOnly={isEdit}
                />
                {isEdit && (
                  <p className="text-xs text-muted-foreground">لتعديل الكمية استخدم زر تعديل المخزون</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minqty">الحد الأدنى للتنبيه</Label>
                <Input
                  id="minqty"
                  type="number"
                  step="0.01"
                  {...register("min_quantity")}
                  className="ltr"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة السلعة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
