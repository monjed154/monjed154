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
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/services/tauriBridge";
import type { Customer } from "@/types";

const schema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  credit_limit: z.coerce.number().min(0),
});

type FormData = z.infer<typeof schema>;

interface Props {
  customer: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CustomerForm({ customer, onClose, onSuccess }: Props) {
  const isEdit = !!customer;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: customer
      ? {
          name: customer.name,
          phone: customer.phone ?? "",
          phone2: customer.phone2 ?? "",
          address: customer.address ?? "",
          notes: customer.notes ?? "",
          credit_limit: customer.credit_limit,
        }
      : { credit_limit: 0 },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        name: data.name,
        phone: data.phone || undefined,
        phone2: data.phone2 || undefined,
        address: data.address || undefined,
        notes: data.notes || undefined,
        credit_limit: data.credit_limit,
      };
      if (isEdit && customer) {
        await db.updateCustomer(customer.id, payload);
        return 0;
      }
      return db.addCustomer(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "تم تحديث بيانات العميل" : "تمت إضافة العميل");
      onSuccess();
    },
    onError: (e) => toast.error(String(e)),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل بيانات عميل" : "إضافة عميل جديد"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d as unknown as FormData))}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label>اسم العميل *</Label>
            <Input {...register("name")} placeholder="أدخل اسم العميل" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <Input {...register("phone")} placeholder="0555..." className="ltr" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>هاتف بديل</Label>
              <Input {...register("phone2")} placeholder="0555..." className="ltr" dir="ltr" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>العنوان</Label>
            <Input {...register("address")} placeholder="العنوان..." />
          </div>

          <div className="space-y-1.5">
            <Label>حد الائتمان (دج)</Label>
            <Input type="number" {...register("credit_limit")} className="ltr" />
          </div>

          <div className="space-y-1.5">
            <Label>ملاحظات</Label>
            <Textarea {...register("notes")} placeholder="ملاحظات..." rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
