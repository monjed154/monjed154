use rusqlite::{Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

pub struct DbState(pub Mutex<Connection>);

// ============================
// Models
// ============================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub color: String,
    pub icon: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Product {
    pub id: i64,
    pub barcode: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub category_id: Option<i64>,
    pub category_name: Option<String>,
    pub unit: String,
    pub purchase_price: f64,
    pub selling_price: f64,
    pub quantity: f64,
    pub min_quantity: f64,
    pub image_path: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewProduct {
    pub barcode: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub category_id: Option<i64>,
    pub unit: String,
    pub purchase_price: f64,
    pub selling_price: f64,
    pub quantity: f64,
    pub min_quantity: f64,
    pub image_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProduct {
    pub id: i64,
    pub barcode: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub category_id: Option<i64>,
    pub unit: String,
    pub purchase_price: f64,
    pub selling_price: f64,
    pub min_quantity: f64,
    pub image_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Customer {
    pub id: i64,
    pub name: String,
    pub phone: Option<String>,
    pub phone2: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub credit_limit: f64,
    pub balance: f64,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewCustomer {
    pub name: String,
    pub phone: Option<String>,
    pub phone2: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub credit_limit: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SaleItem {
    pub id: Option<i64>,
    pub sale_id: Option<i64>,
    pub product_id: i64,
    pub product_name: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub purchase_price: f64,
    pub discount: f64,
    pub total: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Sale {
    pub id: i64,
    pub invoice_number: String,
    pub customer_id: Option<i64>,
    pub customer_name: Option<String>,
    pub sale_date: String,
    pub subtotal: f64,
    pub discount_type: String,
    pub discount_value: f64,
    pub discount_amount: f64,
    pub total_amount: f64,
    pub paid_amount: f64,
    pub debt_amount: f64,
    pub payment_method: String,
    pub notes: Option<String>,
    pub status: String,
    pub items: Option<Vec<SaleItem>>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewSale {
    pub customer_id: Option<i64>,
    pub subtotal: f64,
    pub discount_type: String,
    pub discount_value: f64,
    pub discount_amount: f64,
    pub total_amount: f64,
    pub paid_amount: f64,
    pub debt_amount: f64,
    pub payment_method: String,
    pub notes: Option<String>,
    pub items: Vec<SaleItem>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Debt {
    pub id: i64,
    pub customer_id: i64,
    pub customer_name: String,
    pub customer_phone: Option<String>,
    pub sale_id: Option<i64>,
    pub invoice_number: Option<String>,
    pub amount: f64,
    pub paid_amount: f64,
    pub remaining: f64,
    pub due_date: Option<String>,
    pub description: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewDebtPayment {
    pub debt_id: i64,
    pub customer_id: i64,
    pub amount: f64,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardStats {
    pub today_sales: f64,
    pub today_sales_count: i64,
    pub today_profit: f64,
    pub total_debt: f64,
    pub debt_customers_count: i64,
    pub low_stock_count: i64,
    pub out_of_stock_count: i64,
    pub total_products: i64,
    pub total_inventory_value: f64,
    pub today_movements: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SalesChartData {
    pub date: String,
    pub sales: f64,
    pub profit: f64,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TopProduct {
    pub product_id: i64,
    pub product_name: String,
    pub total_quantity: f64,
    pub total_revenue: f64,
    pub total_profit: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StockMovement {
    pub id: i64,
    pub product_id: i64,
    pub product_name: String,
    pub type_: String,
    pub quantity: f64,
    pub reason: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
}

// ============================
// DB helpers
// ============================

fn init_db(conn: &Connection) -> SqlResult<()> {
    conn.execute_batch(include_str!("db/schema.sql"))
}

fn next_invoice_number(conn: &Connection) -> SqlResult<String> {
    let year = current_year();
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM sales WHERE strftime('%Y', created_at) = ?1",
            rusqlite::params![year],
            |r| r.get(0),
        )
        .unwrap_or(0);
    Ok(format!("INV-{}-{:04}", year, count + 1))
}

fn current_year() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let days_since_epoch = secs / 86400;
    let year = 1970 + days_since_epoch / 365;
    year.to_string()
}

fn fetch_sale(conn: &Connection, id: i64) -> Result<Option<Sale>, String> {
    let sale_result = conn.query_row(
        "SELECT s.id, s.invoice_number, s.customer_id, c.name, s.sale_date,
                s.subtotal, s.discount_type, s.discount_value, s.discount_amount,
                s.total_amount, s.paid_amount, s.debt_amount, s.payment_method,
                s.notes, s.status, s.created_at
         FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
         WHERE s.id = ?1",
        [id],
        |row| {
            Ok(Sale {
                id: row.get(0)?,
                invoice_number: row.get(1)?,
                customer_id: row.get(2)?,
                customer_name: row.get(3)?,
                sale_date: row.get::<_, Option<String>>(4)?.unwrap_or_default(),
                subtotal: row.get(5)?,
                discount_type: row
                    .get::<_, Option<String>>(6)?
                    .unwrap_or_else(|| "AMOUNT".to_string()),
                discount_value: row.get::<_, Option<f64>>(7)?.unwrap_or(0.0),
                discount_amount: row.get::<_, Option<f64>>(8)?.unwrap_or(0.0),
                total_amount: row.get(9)?,
                paid_amount: row.get::<_, Option<f64>>(10)?.unwrap_or(0.0),
                debt_amount: row.get::<_, Option<f64>>(11)?.unwrap_or(0.0),
                payment_method: row
                    .get::<_, Option<String>>(12)?
                    .unwrap_or_else(|| "CASH".to_string()),
                notes: row.get(13)?,
                status: row
                    .get::<_, Option<String>>(14)?
                    .unwrap_or_else(|| "COMPLETED".to_string()),
                items: None,
                created_at: row.get::<_, Option<String>>(15)?.unwrap_or_default(),
            })
        },
    );

    match sale_result {
        Ok(mut sale) => {
            let mut stmt = conn
                .prepare(
                    "SELECT id, sale_id, product_id, product_name, quantity,
                            unit_price, purchase_price, discount, total
                     FROM sale_items WHERE sale_id = ?1",
                )
                .map_err(|e| e.to_string())?;

            let items: Vec<SaleItem> = stmt
                .query_map([sale.id], |row| {
                    Ok(SaleItem {
                        id: row.get(0)?,
                        sale_id: row.get(1)?,
                        product_id: row.get(2)?,
                        product_name: row.get(3)?,
                        quantity: row.get(4)?,
                        unit_price: row.get(5)?,
                        purchase_price: row.get(6)?,
                        discount: row.get::<_, Option<f64>>(7)?.unwrap_or(0.0),
                        total: row.get(8)?,
                    })
                })
                .map_err(|e| e.to_string())?
                .filter_map(|r| r.ok())
                .collect();

            sale.items = Some(items);
            Ok(Some(sale))
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// ============================
// Commands (in submodule to avoid macro namespace conflicts)
// ============================

pub mod commands {
    use tauri::State;
    use super::{
        DbState, Category, Product, NewProduct, UpdateProduct,
        Customer, NewCustomer, Sale, NewSale, SaleItem,
        Debt, NewDebtPayment, DashboardStats, SalesChartData,
        TopProduct, StockMovement, fetch_sale, next_invoice_number,
    };

    #[tauri::command]
    pub fn get_categories(state: State<DbState>) -> Result<Vec<Category>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, name, description, color, icon, created_at
                 FROM categories ORDER BY name",
            )
            .map_err(|e| e.to_string())?;

        let categories = stmt
            .query_map([], |row| {
                Ok(Category {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    color: row
                        .get::<_, Option<String>>(3)?
                        .unwrap_or_else(|| "#6366f1".to_string()),
                    icon: row.get(4)?,
                    created_at: row.get::<_, Option<String>>(5)?.unwrap_or_default(),
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        Ok(categories)
    }

    #[tauri::command]
    pub fn add_category(
        state: State<DbState>,
        name: String,
        color: Option<String>,
        icon: Option<String>,
    ) -> Result<i64, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO categories (name, color, icon) VALUES (?1, ?2, ?3)",
            rusqlite::params![name, color.unwrap_or_else(|| "#6366f1".to_string()), icon],
        )
        .map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    #[tauri::command]
    pub fn get_products(
        state: State<DbState>,
        search: Option<String>,
        category_id: Option<i64>,
        stock_filter: Option<String>,
    ) -> Result<Vec<Product>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let search_term = search
            .map(|s| format!("%{}%", s))
            .unwrap_or_else(|| "%".to_string());

        let stock_clause = match stock_filter.as_deref() {
            Some("low") => "AND p.quantity > 0 AND p.quantity <= p.min_quantity",
            Some("out") => "AND p.quantity <= 0",
            _ => "",
        };

        let cat_clause = if category_id.is_some() {
            "AND p.category_id = ?3"
        } else {
            ""
        };

        let sql = format!(
            "SELECT p.id, p.barcode, p.name, p.description, p.category_id, c.name,
                    p.unit, p.purchase_price, p.selling_price, p.quantity, p.min_quantity,
                    p.image_path, p.is_active, p.created_at, p.updated_at
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.is_active = 1 AND (p.name LIKE ?1 OR COALESCE(p.barcode,'') LIKE ?1)
             {} {}
             ORDER BY p.name",
            stock_clause, cat_clause
        );

        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

        let map_row = |row: &rusqlite::Row| -> rusqlite::Result<Product> {
            Ok(Product {
                id: row.get(0)?,
                barcode: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                category_id: row.get(4)?,
                category_name: row.get(5)?,
                unit: row
                    .get::<_, Option<String>>(6)?
                    .unwrap_or_else(|| "قطعة".to_string()),
                purchase_price: row.get(7)?,
                selling_price: row.get(8)?,
                quantity: row.get(9)?,
                min_quantity: row.get::<_, Option<f64>>(10)?.unwrap_or(5.0),
                image_path: row.get(11)?,
                is_active: row.get::<_, i64>(12)? == 1,
                created_at: row.get::<_, Option<String>>(13)?.unwrap_or_default(),
                updated_at: row.get::<_, Option<String>>(14)?.unwrap_or_default(),
            })
        };

        let products: Vec<Product> = if let Some(cat_id) = category_id {
            stmt.query_map(
                rusqlite::params![search_term, search_term, cat_id],
                map_row,
            )
        } else {
            stmt.query_map(rusqlite::params![search_term, search_term], map_row)
        }
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

        Ok(products)
    }

    #[tauri::command]
    pub fn get_product(state: State<DbState>, id: i64) -> Result<Option<Product>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let result = conn.query_row(
            "SELECT p.id, p.barcode, p.name, p.description, p.category_id, c.name,
                    p.unit, p.purchase_price, p.selling_price, p.quantity, p.min_quantity,
                    p.image_path, p.is_active, p.created_at, p.updated_at
             FROM products p LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ?1",
            [id],
            |row| {
                Ok(Product {
                    id: row.get(0)?,
                    barcode: row.get(1)?,
                    name: row.get(2)?,
                    description: row.get(3)?,
                    category_id: row.get(4)?,
                    category_name: row.get(5)?,
                    unit: row
                        .get::<_, Option<String>>(6)?
                        .unwrap_or_else(|| "قطعة".to_string()),
                    purchase_price: row.get(7)?,
                    selling_price: row.get(8)?,
                    quantity: row.get(9)?,
                    min_quantity: row.get::<_, Option<f64>>(10)?.unwrap_or(5.0),
                    image_path: row.get(11)?,
                    is_active: row.get::<_, i64>(12)? == 1,
                    created_at: row.get::<_, Option<String>>(13)?.unwrap_or_default(),
                    updated_at: row.get::<_, Option<String>>(14)?.unwrap_or_default(),
                })
            },
        );
        match result {
            Ok(p) => Ok(Some(p)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    #[tauri::command]
    pub fn get_product_by_barcode(
        state: State<DbState>,
        barcode: String,
    ) -> Result<Option<Product>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let result = conn.query_row(
            "SELECT p.id, p.barcode, p.name, p.description, p.category_id, c.name,
                    p.unit, p.purchase_price, p.selling_price, p.quantity, p.min_quantity,
                    p.image_path, p.is_active, p.created_at, p.updated_at
             FROM products p LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.barcode = ?1 AND p.is_active = 1",
            [barcode],
            |row| {
                Ok(Product {
                    id: row.get(0)?,
                    barcode: row.get(1)?,
                    name: row.get(2)?,
                    description: row.get(3)?,
                    category_id: row.get(4)?,
                    category_name: row.get(5)?,
                    unit: row
                        .get::<_, Option<String>>(6)?
                        .unwrap_or_else(|| "قطعة".to_string()),
                    purchase_price: row.get(7)?,
                    selling_price: row.get(8)?,
                    quantity: row.get(9)?,
                    min_quantity: row.get::<_, Option<f64>>(10)?.unwrap_or(5.0),
                    image_path: row.get(11)?,
                    is_active: row.get::<_, i64>(12)? == 1,
                    created_at: row.get::<_, Option<String>>(13)?.unwrap_or_default(),
                    updated_at: row.get::<_, Option<String>>(14)?.unwrap_or_default(),
                })
            },
        );
        match result {
            Ok(p) => Ok(Some(p)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    #[tauri::command]
    pub fn add_product(state: State<DbState>, product: NewProduct) -> Result<i64, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO products (barcode, name, description, category_id, unit,
             purchase_price, selling_price, quantity, min_quantity, image_path)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            rusqlite::params![
                product.barcode,
                product.name,
                product.description,
                product.category_id,
                product.unit,
                product.purchase_price,
                product.selling_price,
                product.quantity,
                product.min_quantity,
                product.image_path
            ],
        )
        .map_err(|e| e.to_string())?;

        let id = conn.last_insert_rowid();

        if product.quantity > 0.0 {
            conn.execute(
                "INSERT INTO stock_movements (product_id, type, quantity, reason)
                 VALUES (?1, 'IN', ?2, 'مخزون أولي')",
                rusqlite::params![id, product.quantity],
            )
            .map_err(|e| e.to_string())?;
        }

        Ok(id)
    }

    #[tauri::command]
    pub fn update_product(state: State<DbState>, product: UpdateProduct) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE products SET barcode=?1, name=?2, description=?3, category_id=?4,
             unit=?5, purchase_price=?6, selling_price=?7, min_quantity=?8,
             image_path=?9, updated_at=CURRENT_TIMESTAMP WHERE id=?10",
            rusqlite::params![
                product.barcode,
                product.name,
                product.description,
                product.category_id,
                product.unit,
                product.purchase_price,
                product.selling_price,
                product.min_quantity,
                product.image_path,
                product.id
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub fn delete_product(state: State<DbState>, id: i64) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?1",
            [id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub fn adjust_stock(
        state: State<DbState>,
        product_id: i64,
        quantity_change: f64,
        reason: String,
        notes: Option<String>,
    ) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let movement_type = if quantity_change >= 0.0 { "IN" } else { "OUT" };

        conn.execute(
            "UPDATE products SET quantity = quantity + ?1,
             updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
            rusqlite::params![quantity_change, product_id],
        )
        .map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT INTO stock_movements (product_id, type, quantity, reason, notes)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![
                product_id,
                movement_type,
                quantity_change.abs(),
                reason,
                notes
            ],
        )
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    #[tauri::command]
    pub fn get_customers(
        state: State<DbState>,
        search: Option<String>,
    ) -> Result<Vec<Customer>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let search_term = search
            .map(|s| format!("%{}%", s))
            .unwrap_or_else(|| "%".to_string());

        let mut stmt = conn
            .prepare(
                "SELECT id, name, phone, phone2, address, notes, credit_limit,
                        balance, is_active, created_at, updated_at
                 FROM customers
                 WHERE is_active = 1 AND (name LIKE ?1 OR COALESCE(phone,'') LIKE ?1)
                 ORDER BY name",
            )
            .map_err(|e| e.to_string())?;

        let customers = stmt
            .query_map([search_term], |row| {
                Ok(Customer {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    phone: row.get(2)?,
                    phone2: row.get(3)?,
                    address: row.get(4)?,
                    notes: row.get(5)?,
                    credit_limit: row.get::<_, Option<f64>>(6)?.unwrap_or(0.0),
                    balance: row.get::<_, Option<f64>>(7)?.unwrap_or(0.0),
                    is_active: row.get::<_, i64>(8)? == 1,
                    created_at: row.get::<_, Option<String>>(9)?.unwrap_or_default(),
                    updated_at: row.get::<_, Option<String>>(10)?.unwrap_or_default(),
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        Ok(customers)
    }

    #[tauri::command]
    pub fn get_customer(state: State<DbState>, id: i64) -> Result<Option<Customer>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let result = conn.query_row(
            "SELECT id, name, phone, phone2, address, notes, credit_limit,
                    balance, is_active, created_at, updated_at
             FROM customers WHERE id = ?1",
            [id],
            |row| {
                Ok(Customer {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    phone: row.get(2)?,
                    phone2: row.get(3)?,
                    address: row.get(4)?,
                    notes: row.get(5)?,
                    credit_limit: row.get::<_, Option<f64>>(6)?.unwrap_or(0.0),
                    balance: row.get::<_, Option<f64>>(7)?.unwrap_or(0.0),
                    is_active: row.get::<_, i64>(8)? == 1,
                    created_at: row.get::<_, Option<String>>(9)?.unwrap_or_default(),
                    updated_at: row.get::<_, Option<String>>(10)?.unwrap_or_default(),
                })
            },
        );
        match result {
            Ok(c) => Ok(Some(c)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    #[tauri::command]
    pub fn add_customer(state: State<DbState>, customer: NewCustomer) -> Result<i64, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO customers (name, phone, phone2, address, notes, credit_limit)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                customer.name,
                customer.phone,
                customer.phone2,
                customer.address,
                customer.notes,
                customer.credit_limit
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    #[tauri::command]
    pub fn update_customer(
        state: State<DbState>,
        id: i64,
        customer: NewCustomer,
    ) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE customers SET name=?1, phone=?2, phone2=?3, address=?4, notes=?5,
             credit_limit=?6, updated_at=CURRENT_TIMESTAMP WHERE id=?7",
            rusqlite::params![
                customer.name,
                customer.phone,
                customer.phone2,
                customer.address,
                customer.notes,
                customer.credit_limit,
                id
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub fn delete_customer(state: State<DbState>, id: i64) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE customers SET is_active = 0 WHERE id = ?1",
            [id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub fn get_sales(
        state: State<DbState>,
        search: Option<String>,
        date_from: Option<String>,
        date_to: Option<String>,
    ) -> Result<Vec<Sale>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let search_term = search
            .map(|s| format!("%{}%", s))
            .unwrap_or_else(|| "%".to_string());
        let df = date_from.unwrap_or_else(|| "1970-01-01".to_string());
        let dt = date_to.unwrap_or_else(|| "2099-12-31".to_string());

        let mut stmt = conn
            .prepare(
                "SELECT s.id, s.invoice_number, s.customer_id, c.name, s.sale_date,
                        s.subtotal, s.discount_type, s.discount_value, s.discount_amount,
                        s.total_amount, s.paid_amount, s.debt_amount, s.payment_method,
                        s.notes, s.status, s.created_at
                 FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
                 WHERE s.status != 'CANCELLED' AND s.invoice_number LIKE ?1
                 AND date(s.sale_date) BETWEEN ?2 AND ?3
                 ORDER BY s.created_at DESC LIMIT 200",
            )
            .map_err(|e| e.to_string())?;

        let sales = stmt
            .query_map(rusqlite::params![search_term, df, dt], |row| {
                Ok(Sale {
                    id: row.get(0)?,
                    invoice_number: row.get(1)?,
                    customer_id: row.get(2)?,
                    customer_name: row.get(3)?,
                    sale_date: row.get::<_, Option<String>>(4)?.unwrap_or_default(),
                    subtotal: row.get(5)?,
                    discount_type: row
                        .get::<_, Option<String>>(6)?
                        .unwrap_or_else(|| "AMOUNT".to_string()),
                    discount_value: row.get::<_, Option<f64>>(7)?.unwrap_or(0.0),
                    discount_amount: row.get::<_, Option<f64>>(8)?.unwrap_or(0.0),
                    total_amount: row.get(9)?,
                    paid_amount: row.get::<_, Option<f64>>(10)?.unwrap_or(0.0),
                    debt_amount: row.get::<_, Option<f64>>(11)?.unwrap_or(0.0),
                    payment_method: row
                        .get::<_, Option<String>>(12)?
                        .unwrap_or_else(|| "CASH".to_string()),
                    notes: row.get(13)?,
                    status: row
                        .get::<_, Option<String>>(14)?
                        .unwrap_or_else(|| "COMPLETED".to_string()),
                    items: None,
                    created_at: row.get::<_, Option<String>>(15)?.unwrap_or_default(),
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        Ok(sales)
    }

    #[tauri::command]
    pub fn get_sale(state: State<DbState>, id: i64) -> Result<Option<Sale>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        fetch_sale(&conn, id)
    }

    #[tauri::command]
    pub fn create_sale(state: State<DbState>, sale: NewSale) -> Result<Sale, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let invoice_number = next_invoice_number(&conn).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT INTO sales (invoice_number, customer_id, subtotal, discount_type,
             discount_value, discount_amount, total_amount, paid_amount, debt_amount,
             payment_method, notes)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
            rusqlite::params![
                invoice_number,
                sale.customer_id,
                sale.subtotal,
                sale.discount_type,
                sale.discount_value,
                sale.discount_amount,
                sale.total_amount,
                sale.paid_amount,
                sale.debt_amount,
                sale.payment_method,
                sale.notes
            ],
        )
        .map_err(|e| e.to_string())?;

        let sale_id = conn.last_insert_rowid();

        for item in &sale.items {
            conn.execute(
                "INSERT INTO sale_items (sale_id, product_id, product_name, quantity,
                 unit_price, purchase_price, discount, total)
                 VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
                rusqlite::params![
                    sale_id,
                    item.product_id,
                    item.product_name,
                    item.quantity,
                    item.unit_price,
                    item.purchase_price,
                    item.discount,
                    item.total
                ],
            )
            .map_err(|e| e.to_string())?;

            conn.execute(
                "UPDATE products SET quantity = quantity - ?1,
                 updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
                rusqlite::params![item.quantity, item.product_id],
            )
            .map_err(|e| e.to_string())?;

            conn.execute(
                "INSERT INTO stock_movements (product_id, type, quantity, reason, reference_id)
                 VALUES (?1,'OUT',?2,'بيع',?3)",
                rusqlite::params![item.product_id, item.quantity, sale_id],
            )
            .map_err(|e| e.to_string())?;
        }

        if sale.debt_amount > 0.0 {
            if let Some(cust_id) = sale.customer_id {
                conn.execute(
                    "INSERT INTO debts (customer_id, sale_id, amount, paid_amount, remaining, description)
                     VALUES (?1,?2,?3,0,?3,?4)",
                    rusqlite::params![
                        cust_id,
                        sale_id,
                        sale.debt_amount,
                        format!("دين من فاتورة {}", invoice_number)
                    ],
                )
                .map_err(|e| e.to_string())?;

                conn.execute(
                    "UPDATE customers SET balance = balance - ?1,
                     updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
                    rusqlite::params![sale.debt_amount, cust_id],
                )
                .map_err(|e| e.to_string())?;
            }
        }

        fetch_sale(&conn, sale_id)?.ok_or_else(|| "Failed to fetch created sale".to_string())
    }

    #[tauri::command]
    pub fn cancel_sale(state: State<DbState>, id: i64) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;

        let mut stmt = conn
            .prepare("SELECT product_id, quantity FROM sale_items WHERE sale_id = ?1")
            .map_err(|e| e.to_string())?;

        let items: Vec<(i64, f64)> = stmt
            .query_map([id], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        for (product_id, qty) in items {
            conn.execute(
                "UPDATE products SET quantity = quantity + ?1,
                 updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
                rusqlite::params![qty, product_id],
            )
            .map_err(|e| e.to_string())?;

            conn.execute(
                "INSERT INTO stock_movements (product_id, type, quantity, reason, reference_id)
                 VALUES (?1,'IN',?2,'إلغاء فاتورة',?3)",
                rusqlite::params![product_id, qty, id],
            )
            .map_err(|e| e.to_string())?;
        }

        let debt_amount: f64 = conn
            .query_row(
                "SELECT COALESCE(debt_amount,0) FROM sales WHERE id = ?1",
                [id],
                |r| r.get(0),
            )
            .unwrap_or(0.0);

        let customer_id: Option<i64> = conn
            .query_row(
                "SELECT customer_id FROM sales WHERE id = ?1",
                [id],
                |r| r.get(0),
            )
            .unwrap_or(None);

        if debt_amount > 0.0 {
            if let Some(cust_id) = customer_id {
                conn.execute(
                    "UPDATE customers SET balance = balance + ?1,
                     updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
                    rusqlite::params![debt_amount, cust_id],
                )
                .map_err(|e| e.to_string())?;

                conn.execute(
                    "UPDATE debts SET status = 'CANCELLED',
                     updated_at = CURRENT_TIMESTAMP WHERE sale_id = ?1",
                    [id],
                )
                .map_err(|e| e.to_string())?;
            }
        }

        conn.execute("UPDATE sales SET status = 'CANCELLED' WHERE id = ?1", [id])
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    #[tauri::command]
    pub fn get_debts(
        state: State<DbState>,
        search: Option<String>,
        status_filter: Option<String>,
    ) -> Result<Vec<Debt>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let search_term = search
            .map(|s| format!("%{}%", s))
            .unwrap_or_else(|| "%".to_string());

        let status_clause = match status_filter.as_deref() {
            Some("PENDING") => "AND d.status = 'PENDING'",
            Some("PARTIAL") => "AND d.status = 'PARTIAL'",
            Some("PAID") => "AND d.status = 'PAID'",
            _ => "AND d.status NOT IN ('CANCELLED','PAID')",
        };

        let sql = format!(
            "SELECT d.id, d.customer_id, c.name, c.phone, d.sale_id, s.invoice_number,
                    d.amount, d.paid_amount, d.remaining, d.due_date, d.description,
                    d.status, d.created_at, d.updated_at
             FROM debts d
             JOIN customers c ON d.customer_id = c.id
             LEFT JOIN sales s ON d.sale_id = s.id
             WHERE (c.name LIKE ?1 OR COALESCE(c.phone,'') LIKE ?1) {}
             ORDER BY d.created_at DESC",
            status_clause
        );

        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

        let debts = stmt
            .query_map([search_term], |row| {
                Ok(Debt {
                    id: row.get(0)?,
                    customer_id: row.get(1)?,
                    customer_name: row.get(2)?,
                    customer_phone: row.get(3)?,
                    sale_id: row.get(4)?,
                    invoice_number: row.get(5)?,
                    amount: row.get(6)?,
                    paid_amount: row.get::<_, Option<f64>>(7)?.unwrap_or(0.0),
                    remaining: row.get(8)?,
                    due_date: row.get(9)?,
                    description: row.get(10)?,
                    status: row
                        .get::<_, Option<String>>(11)?
                        .unwrap_or_else(|| "PENDING".to_string()),
                    created_at: row.get::<_, Option<String>>(12)?.unwrap_or_default(),
                    updated_at: row.get::<_, Option<String>>(13)?.unwrap_or_default(),
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        Ok(debts)
    }

    #[tauri::command]
    pub fn get_customer_debts(
        state: State<DbState>,
        customer_id: i64,
    ) -> Result<Vec<Debt>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT d.id, d.customer_id, c.name, c.phone, d.sale_id, s.invoice_number,
                        d.amount, d.paid_amount, d.remaining, d.due_date, d.description,
                        d.status, d.created_at, d.updated_at
                 FROM debts d
                 JOIN customers c ON d.customer_id = c.id
                 LEFT JOIN sales s ON d.sale_id = s.id
                 WHERE d.customer_id = ?1 AND d.status != 'CANCELLED'
                 ORDER BY d.created_at DESC",
            )
            .map_err(|e| e.to_string())?;

        let debts = stmt
            .query_map([customer_id], |row| {
                Ok(Debt {
                    id: row.get(0)?,
                    customer_id: row.get(1)?,
                    customer_name: row.get(2)?,
                    customer_phone: row.get(3)?,
                    sale_id: row.get(4)?,
                    invoice_number: row.get(5)?,
                    amount: row.get(6)?,
                    paid_amount: row.get::<_, Option<f64>>(7)?.unwrap_or(0.0),
                    remaining: row.get(8)?,
                    due_date: row.get(9)?,
                    description: row.get(10)?,
                    status: row
                        .get::<_, Option<String>>(11)?
                        .unwrap_or_else(|| "PENDING".to_string()),
                    created_at: row.get::<_, Option<String>>(12)?.unwrap_or_default(),
                    updated_at: row.get::<_, Option<String>>(13)?.unwrap_or_default(),
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        Ok(debts)
    }

    #[tauri::command]
    pub fn add_debt_payment(
        state: State<DbState>,
        payment: NewDebtPayment,
    ) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;

        let (current_paid, total_amount): (f64, f64) = conn
            .query_row(
                "SELECT paid_amount, amount FROM debts WHERE id = ?1",
                [payment.debt_id],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .map_err(|e| e.to_string())?;

        let new_paid = current_paid + payment.amount;
        let new_remaining = (total_amount - new_paid).max(0.0);
        let new_status = if new_remaining <= 0.0 { "PAID" } else { "PARTIAL" };

        conn.execute(
            "UPDATE debts SET paid_amount=?1, remaining=?2, status=?3,
             updated_at=CURRENT_TIMESTAMP WHERE id=?4",
            rusqlite::params![new_paid, new_remaining, new_status, payment.debt_id],
        )
        .map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT INTO debt_payments (debt_id, customer_id, amount, notes)
             VALUES (?1,?2,?3,?4)",
            rusqlite::params![
                payment.debt_id,
                payment.customer_id,
                payment.amount,
                payment.notes
            ],
        )
        .map_err(|e| e.to_string())?;

        conn.execute(
            "UPDATE customers SET balance = balance + ?1,
             updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
            rusqlite::params![payment.amount, payment.customer_id],
        )
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    #[tauri::command]
    pub fn get_dashboard_stats(state: State<DbState>) -> Result<DashboardStats, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;

        let (today_sales, today_count): (f64, i64) = conn
            .query_row(
                "SELECT COALESCE(SUM(total_amount),0), COUNT(*)
                 FROM sales WHERE date(sale_date)=date('now') AND status='COMPLETED'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap_or((0.0, 0));

        let today_profit: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(si.total - si.purchase_price * si.quantity),0)
                 FROM sale_items si JOIN sales s ON si.sale_id=s.id
                 WHERE date(s.sale_date)=date('now') AND s.status='COMPLETED'",
                [],
                |r| r.get(0),
            )
            .unwrap_or(0.0);

        let (total_debt, debt_customers): (f64, i64) = conn
            .query_row(
                "SELECT COALESCE(SUM(remaining),0), COUNT(DISTINCT customer_id)
                 FROM debts WHERE status IN ('PENDING','PARTIAL')",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap_or((0.0, 0));

        let low_stock: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM products
                 WHERE is_active=1 AND quantity>0 AND quantity<=min_quantity",
                [],
                |r| r.get(0),
            )
            .unwrap_or(0);

        let out_of_stock: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM products WHERE is_active=1 AND quantity<=0",
                [],
                |r| r.get(0),
            )
            .unwrap_or(0);

        let (total_products, inventory_value): (i64, f64) = conn
            .query_row(
                "SELECT COUNT(*), COALESCE(SUM(purchase_price*quantity),0)
                 FROM products WHERE is_active=1",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap_or((0, 0.0));

        let today_movements: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM stock_movements WHERE date(created_at)=date('now')",
                [],
                |r| r.get(0),
            )
            .unwrap_or(0);

        Ok(DashboardStats {
            today_sales,
            today_sales_count: today_count,
            today_profit,
            total_debt,
            debt_customers_count: debt_customers,
            low_stock_count: low_stock,
            out_of_stock_count: out_of_stock,
            total_products,
            total_inventory_value: inventory_value,
            today_movements,
        })
    }

    #[tauri::command]
    pub fn get_sales_chart(
        state: State<DbState>,
        days: i64,
    ) -> Result<Vec<SalesChartData>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let offset = format!("-{} days", days);

        let mut stmt = conn
            .prepare(
                "SELECT date(s.sale_date) as day,
                        COALESCE(SUM(s.total_amount),0) as sales,
                        COALESCE(SUM(si.total - si.purchase_price*si.quantity),0) as profit,
                        COUNT(DISTINCT s.id) as cnt
                 FROM sales s
                 LEFT JOIN sale_items si ON si.sale_id=s.id
                 WHERE s.status='COMPLETED' AND date(s.sale_date)>=date('now',?1)
                 GROUP BY day ORDER BY day ASC",
            )
            .map_err(|e| e.to_string())?;

        let data = stmt
            .query_map([offset], |row| {
                Ok(SalesChartData {
                    date: row.get::<_, Option<String>>(0)?.unwrap_or_default(),
                    sales: row.get(1)?,
                    profit: row.get(2)?,
                    count: row.get(3)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        Ok(data)
    }

    #[tauri::command]
    pub fn get_top_products(
        state: State<DbState>,
        days: i64,
    ) -> Result<Vec<TopProduct>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let offset = format!("-{} days", days);

        let mut stmt = conn
            .prepare(
                "SELECT si.product_id, si.product_name,
                        SUM(si.quantity) as total_qty,
                        SUM(si.total) as total_revenue,
                        SUM(si.total - si.purchase_price*si.quantity) as total_profit
                 FROM sale_items si JOIN sales s ON si.sale_id=s.id
                 WHERE s.status='COMPLETED' AND date(s.sale_date)>=date('now',?1)
                 GROUP BY si.product_id
                 ORDER BY total_qty DESC LIMIT 10",
            )
            .map_err(|e| e.to_string())?;

        let products = stmt
            .query_map([offset], |row| {
                Ok(TopProduct {
                    product_id: row.get(0)?,
                    product_name: row.get(1)?,
                    total_quantity: row.get(2)?,
                    total_revenue: row.get(3)?,
                    total_profit: row.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        Ok(products)
    }

    #[tauri::command]
    pub fn get_stock_movements(
        state: State<DbState>,
        product_id: Option<i64>,
    ) -> Result<Vec<StockMovement>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;

        let map_row = |row: &rusqlite::Row| -> rusqlite::Result<StockMovement> {
            Ok(StockMovement {
                id: row.get(0)?,
                product_id: row.get(1)?,
                product_name: row.get(2)?,
                type_: row.get(3)?,
                quantity: row.get(4)?,
                reason: row.get(5)?,
                notes: row.get(6)?,
                created_at: row.get::<_, Option<String>>(7)?.unwrap_or_default(),
            })
        };

        let movements: Vec<StockMovement> = if let Some(pid) = product_id {
            let mut stmt = conn
                .prepare(
                    "SELECT sm.id, sm.product_id, p.name, sm.type, sm.quantity,
                            sm.reason, sm.notes, sm.created_at
                     FROM stock_movements sm JOIN products p ON sm.product_id=p.id
                     WHERE sm.product_id=?1 ORDER BY sm.created_at DESC LIMIT 100",
                )
                .map_err(|e| e.to_string())?;
            stmt.query_map([pid], map_row)
                .map_err(|e| e.to_string())?
                .filter_map(|r| r.ok())
                .collect()
        } else {
            let mut stmt = conn
                .prepare(
                    "SELECT sm.id, sm.product_id, p.name, sm.type, sm.quantity,
                            sm.reason, sm.notes, sm.created_at
                     FROM stock_movements sm JOIN products p ON sm.product_id=p.id
                     ORDER BY sm.created_at DESC LIMIT 100",
                )
                .map_err(|e| e.to_string())?;
            stmt.query_map([], map_row)
                .map_err(|e| e.to_string())?
                .filter_map(|r| r.ok())
                .collect()
        };

        Ok(movements)
    }

    #[tauri::command]
    pub fn get_settings(
        state: State<DbState>,
    ) -> Result<std::collections::HashMap<String, String>, String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT key, value FROM settings")
            .map_err(|e| e.to_string())?;

        let mut map = std::collections::HashMap::new();
        let rows = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, Option<String>>(1)?.unwrap_or_default(),
                ))
            })
            .map_err(|e| e.to_string())?;

        for row in rows.filter_map(|r| r.ok()) {
            map.insert(row.0, row.1);
        }

        Ok(map)
    }

    #[tauri::command]
    pub fn update_setting(
        state: State<DbState>,
        key: String,
        value: String,
    ) -> Result<(), String> {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO settings (key, value, updated_at) VALUES (?1,?2,CURRENT_TIMESTAMP)
             ON CONFLICT(key) DO UPDATE SET value=?2, updated_at=CURRENT_TIMESTAMP",
            rusqlite::params![key, value],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }
}

// ============================
// App Entry Point
// ============================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_path = dirs::data_local_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("stockflow")
        .join("stockflow.db");

    std::fs::create_dir_all(db_path.parent().unwrap()).unwrap_or(());

    let conn = Connection::open(&db_path).expect("Failed to open database");
    init_db(&conn).expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(DbState(Mutex::new(conn)))
        .invoke_handler(tauri::generate_handler![
            commands::get_categories,
            commands::add_category,
            commands::get_products,
            commands::get_product,
            commands::get_product_by_barcode,
            commands::add_product,
            commands::update_product,
            commands::delete_product,
            commands::adjust_stock,
            commands::get_customers,
            commands::get_customer,
            commands::add_customer,
            commands::update_customer,
            commands::delete_customer,
            commands::get_sales,
            commands::get_sale,
            commands::create_sale,
            commands::cancel_sale,
            commands::get_debts,
            commands::get_customer_debts,
            commands::add_debt_payment,
            commands::get_dashboard_stats,
            commands::get_sales_chart,
            commands::get_top_products,
            commands::get_stock_movements,
            commands::get_settings,
            commands::update_setting,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
