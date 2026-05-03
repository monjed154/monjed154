import { invoke } from "@tauri-apps/api/core";
import type {
  Category,
  Product,
  NewProduct,
  UpdateProduct,
  Customer,
  NewCustomer,
  Sale,
  NewSale,
  Debt,
  NewDebtPayment,
  DashboardStats,
  SalesChartData,
  TopProduct,
  StockMovement,
  AppSettings,
} from "@/types";

export const db = {
  // Categories
  getCategories: () => invoke<Category[]>("get_categories"),
  addCategory: (name: string, color?: string, icon?: string) =>
    invoke<number>("add_category", { name, color, icon }),

  // Products
  getProducts: (search?: string, categoryId?: number, stockFilter?: string) =>
    invoke<Product[]>("get_products", {
      search: search || null,
      categoryId: categoryId || null,
      stockFilter: stockFilter || null,
    }),
  getProduct: (id: number) => invoke<Product | null>("get_product", { id }),
  getProductByBarcode: (barcode: string) =>
    invoke<Product | null>("get_product_by_barcode", { barcode }),
  addProduct: (product: NewProduct) =>
    invoke<number>("add_product", { product }),
  updateProduct: (product: UpdateProduct) =>
    invoke<void>("update_product", { product }),
  deleteProduct: (id: number) => invoke<void>("delete_product", { id }),
  adjustStock: (
    productId: number,
    quantityChange: number,
    reason: string,
    notes?: string
  ) =>
    invoke<void>("adjust_stock", {
      productId,
      quantityChange,
      reason,
      notes: notes || null,
    }),

  // Customers
  getCustomers: (search?: string) =>
    invoke<Customer[]>("get_customers", { search: search || null }),
  getCustomer: (id: number) =>
    invoke<Customer | null>("get_customer", { id }),
  addCustomer: (customer: NewCustomer) =>
    invoke<number>("add_customer", { customer }),
  updateCustomer: (id: number, customer: NewCustomer) =>
    invoke<void>("update_customer", { id, customer }),
  deleteCustomer: (id: number) =>
    invoke<void>("delete_customer", { id }),

  // Sales
  getSales: (search?: string, dateFrom?: string, dateTo?: string) =>
    invoke<Sale[]>("get_sales", {
      search: search || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    }),
  getSale: (id: number) => invoke<Sale | null>("get_sale", { id }),
  createSale: (sale: NewSale) => invoke<Sale>("create_sale", { sale }),
  cancelSale: (id: number) => invoke<void>("cancel_sale", { id }),

  // Debts
  getDebts: (search?: string, statusFilter?: string) =>
    invoke<Debt[]>("get_debts", {
      search: search || null,
      statusFilter: statusFilter || null,
    }),
  getCustomerDebts: (customerId: number) =>
    invoke<Debt[]>("get_customer_debts", { customerId }),
  addDebtPayment: (payment: NewDebtPayment) =>
    invoke<void>("add_debt_payment", { payment }),

  // Reports
  getDashboardStats: () => invoke<DashboardStats>("get_dashboard_stats"),
  getSalesChart: (days: number) =>
    invoke<SalesChartData[]>("get_sales_chart", { days }),
  getTopProducts: (days: number) =>
    invoke<TopProduct[]>("get_top_products", { days }),
  getStockMovements: (productId?: number) =>
    invoke<StockMovement[]>("get_stock_movements", {
      productId: productId || null,
    }),

  // Settings
  getSettings: () => invoke<Record<string, string>>("get_settings"),
  updateSetting: (key: string, value: string) =>
    invoke<void>("update_setting", { key, value }),
  updateSettings: async (settings: Partial<AppSettings>) => {
    const entries = Object.entries(settings) as [string, string][];
    for (const [key, value] of entries) {
      await invoke<void>("update_setting", { key, value });
    }
  },
};
