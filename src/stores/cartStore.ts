import { create } from "zustand";
import type { CartItem, Customer } from "@/types";

interface CartStore {
  items: CartItem[];
  customer?: Customer;
  discountType: "AMOUNT" | "PERCENT";
  discountValue: number;
  paymentMethod: "CASH" | "DEBT" | "PARTIAL";
  paidAmount: number;
  notes: string;

  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setCustomer: (customer?: Customer) => void;
  setDiscountType: (type: "AMOUNT" | "PERCENT") => void;
  setDiscountValue: (value: number) => void;
  setPaymentMethod: (method: "CASH" | "DEBT" | "PARTIAL") => void;
  setPaidAmount: (amount: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;

  subtotal: () => number;
  discountAmount: () => number;
  total: () => number;
  debtAmount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  customer: undefined,
  discountType: "AMOUNT",
  discountValue: 0,
  paymentMethod: "CASH",
  paidAmount: 0,
  notes: "",

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.product_id === item.product_id);
      if (existing) {
        const newQty = Math.min(
          existing.quantity + item.quantity,
          existing.max_quantity
        );
        return {
          items: state.items.map((i) =>
            i.product_id === item.product_id
              ? { ...i, quantity: newQty, total: newQty * i.unit_price }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product_id !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.product_id === productId
          ? { ...i, quantity, total: quantity * i.unit_price }
          : i
      ),
    })),

  setCustomer: (customer) => set({ customer }),
  setDiscountType: (discountType) => set({ discountType }),
  setDiscountValue: (discountValue) => set({ discountValue }),
  setPaymentMethod: (paymentMethod) =>
    set((state) => ({
      paymentMethod,
      paidAmount:
        paymentMethod === "CASH"
          ? state.total()
          : paymentMethod === "DEBT"
          ? 0
          : state.paidAmount,
    })),
  setPaidAmount: (paidAmount) => set({ paidAmount }),
  setNotes: (notes) => set({ notes }),

  clearCart: () =>
    set({
      items: [],
      customer: undefined,
      discountType: "AMOUNT",
      discountValue: 0,
      paymentMethod: "CASH",
      paidAmount: 0,
      notes: "",
    }),

  subtotal: () =>
    get().items.reduce((sum, i) => sum + i.total, 0),

  discountAmount: () => {
    const { discountType, discountValue } = get();
    const subtotal = get().subtotal();
    if (discountType === "PERCENT") {
      return (subtotal * discountValue) / 100;
    }
    return Math.min(discountValue, subtotal);
  },

  total: () => get().subtotal() - get().discountAmount(),

  debtAmount: () => {
    const { paymentMethod, paidAmount } = get();
    if (paymentMethod === "CASH") return 0;
    if (paymentMethod === "DEBT") return get().total();
    return Math.max(0, get().total() - paidAmount);
  },
}));
