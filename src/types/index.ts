export interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  created_at: string;
}

export interface Product {
  id: number;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: number;
  category_name?: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  min_quantity: number;
  image_path?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewProduct {
  barcode?: string;
  name: string;
  description?: string;
  category_id?: number;
  unit: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  min_quantity: number;
  image_path?: string;
}

export interface UpdateProduct {
  id: number;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: number;
  unit: string;
  purchase_price: number;
  selling_price: number;
  min_quantity: number;
  image_path?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  phone2?: string;
  address?: string;
  notes?: string;
  credit_limit: number;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewCustomer {
  name: string;
  phone?: string;
  phone2?: string;
  address?: string;
  notes?: string;
  credit_limit: number;
}

export interface SaleItem {
  id?: number;
  sale_id?: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  purchase_price: number;
  discount: number;
  total: number;
}

export interface CartItem extends SaleItem {
  unit: string;
  max_quantity: number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  customer_id?: number;
  customer_name?: string;
  sale_date: string;
  subtotal: number;
  discount_type: "AMOUNT" | "PERCENT";
  discount_value: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  debt_amount: number;
  payment_method: "CASH" | "DEBT" | "PARTIAL";
  notes?: string;
  status: "COMPLETED" | "CANCELLED" | "REFUNDED";
  items?: SaleItem[];
  created_at: string;
}

export interface NewSale {
  customer_id?: number;
  subtotal: number;
  discount_type: "AMOUNT" | "PERCENT";
  discount_value: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  debt_amount: number;
  payment_method: "CASH" | "DEBT" | "PARTIAL";
  notes?: string;
  items: SaleItem[];
}

export interface Debt {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone?: string;
  sale_id?: number;
  invoice_number?: string;
  amount: number;
  paid_amount: number;
  remaining: number;
  due_date?: string;
  description?: string;
  status: "PENDING" | "PARTIAL" | "PAID" | "CANCELLED";
  created_at: string;
  updated_at: string;
}

export interface NewDebtPayment {
  debt_id: number;
  customer_id: number;
  amount: number;
  notes?: string;
}

export interface DashboardStats {
  today_sales: number;
  today_sales_count: number;
  today_profit: number;
  total_debt: number;
  debt_customers_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_products: number;
  total_inventory_value: number;
  today_movements: number;
}

export interface SalesChartData {
  date: string;
  sales: number;
  profit: number;
  count: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  total_profit: number;
}

export interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  type_: "IN" | "OUT" | "ADJUST";
  quantity: number;
  reason?: string;
  notes?: string;
  created_at: string;
}

export interface AppSettings {
  store_name: string;
  store_address: string;
  store_phone: string;
  store_logo: string;
  currency: string;
  tax_rate: string;
  low_stock_threshold: string;
  language: string;
  theme: string;
  invoice_footer: string;
  backup_path: string;
}

export type Theme = "dark" | "light";
export type Language = "ar" | "fr" | "en";
