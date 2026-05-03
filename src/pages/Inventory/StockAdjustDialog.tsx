import { useState } from "react";
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
import type { Product } from "@/types";

const REASONS = [
  "استلام بضاعة",
  "مرتجع",
  "تلف",
  "فقدان",
  "تعديل جرد",
  "هدية",
  "عينة",
];

interface Props {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export function StockAdjustDialog({ product, onClose, onSuccess }: Props) {
  const [type, setType] = useState<"add" | "remove">("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) throw new Error("الكمية غير صالحة");
      const change = type === "add" ? qty : -qty;
      return db.adjustStock(product.id, change, reason, notes || undefined);
    },
    onSuccess: () => {
      toast.success("تم تعديل المخزون");
      onSuccess();
    },
    onError: (e) => toast.error(String(e)),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل مخزون: {product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <div>
              <p className="text-sm text-muted-foreground">الكمية الحالية</p>
              <p className="text-xl font-bold ltr">{product.quantity} {product.unit}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("add")}
              className={`p-3 rounded-lg border-2 text-center transition-colors ${
                type === "add"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                  : "border-border"
              }`}
            >
              <p className="text-2xl">+</p>
              <p className="text-sm font-medium">إضافة</p>
            </button>
            <button
              type="button"
              onClick={() => setType("remove")}
              className={`p-3 rounded-lg border-2 text-center transition-colors ${
                type === "remove"
                  ? "border-red-500 bg-red-500/10 text-red-500"
                  : "border-border"
              }`}
            >
              <p className="text-2xl">−</p>
              <p className="text-sm font-medium">خصم</p>
            </button>
          </div>

          <div className="space-y-1.5">
            <Label>الكمية</Label>
            <Input
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="ltr text-xl h-12"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>السبب</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>ملاحظات (اختياري)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!quantity || mutation.isPending}
            variant={type === "add" ? "success" : "destructive"}
          >
            {mutation.isPending ? "جاري الحفظ..." : "تأكيد"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
