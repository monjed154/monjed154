-- ========================
-- الجدول 1: الفئات
-- ========================
CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT,
    color       TEXT DEFAULT '#6366f1',
    icon        TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- الجدول 2: السلع (المنتجات)
-- ========================
CREATE TABLE IF NOT EXISTS products (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode          TEXT UNIQUE,
    name             TEXT NOT NULL,
    description      TEXT,
    category_id      INTEGER REFERENCES categories(id),
    unit             TEXT DEFAULT 'قطعة',
    purchase_price   REAL NOT NULL DEFAULT 0,
    selling_price    REAL NOT NULL DEFAULT 0,
    quantity         REAL NOT NULL DEFAULT 0,
    min_quantity     REAL DEFAULT 5,
    image_path       TEXT,
    is_active        INTEGER DEFAULT 1,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- ========================
-- الجدول 3: حركات المخزون
-- ========================
CREATE TABLE IF NOT EXISTS stock_movements (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id   INTEGER NOT NULL REFERENCES products(id),
    type         TEXT NOT NULL CHECK(type IN ('IN','OUT','ADJUST')),
    quantity     REAL NOT NULL,
    reason       TEXT,
    reference_id INTEGER,
    notes        TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- الجدول 4: العملاء
-- ========================
CREATE TABLE IF NOT EXISTS customers (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    phone        TEXT,
    phone2       TEXT,
    address      TEXT,
    notes        TEXT,
    credit_limit REAL DEFAULT 0,
    balance      REAL DEFAULT 0,
    is_active    INTEGER DEFAULT 1,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ========================
-- الجدول 5: فواتير البيع
-- ========================
CREATE TABLE IF NOT EXISTS sales (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number  TEXT UNIQUE NOT NULL,
    customer_id     INTEGER REFERENCES customers(id),
    sale_date       DATETIME DEFAULT CURRENT_TIMESTAMP,
    subtotal        REAL NOT NULL DEFAULT 0,
    discount_type   TEXT DEFAULT 'AMOUNT',
    discount_value  REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    total_amount    REAL NOT NULL DEFAULT 0,
    paid_amount     REAL DEFAULT 0,
    debt_amount     REAL DEFAULT 0,
    payment_method  TEXT DEFAULT 'CASH',
    notes           TEXT,
    status          TEXT DEFAULT 'COMPLETED',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);

-- ========================
-- الجدول 6: بنود الفاتورة
-- ========================
CREATE TABLE IF NOT EXISTS sale_items (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id        INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id     INTEGER NOT NULL REFERENCES products(id),
    product_name   TEXT NOT NULL,
    quantity       REAL NOT NULL,
    unit_price     REAL NOT NULL,
    purchase_price REAL NOT NULL,
    discount       REAL DEFAULT 0,
    total          REAL NOT NULL
);

-- ========================
-- الجدول 7: الديون
-- ========================
CREATE TABLE IF NOT EXISTS debts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id     INTEGER NOT NULL REFERENCES customers(id),
    sale_id         INTEGER REFERENCES sales(id),
    amount          REAL NOT NULL,
    paid_amount     REAL DEFAULT 0,
    remaining       REAL NOT NULL,
    due_date        DATE,
    description     TEXT,
    status          TEXT DEFAULT 'PENDING',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- الجدول 8: سداد الديون
-- ========================
CREATE TABLE IF NOT EXISTS debt_payments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    debt_id      INTEGER NOT NULL REFERENCES debts(id),
    customer_id  INTEGER NOT NULL REFERENCES customers(id),
    amount       REAL NOT NULL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes        TEXT
);

-- ========================
-- الجدول 9: إعدادات المتجر
-- ========================
CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       TEXT,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO settings (key, value) VALUES
    ('store_name', 'مخزني'),
    ('store_address', ''),
    ('store_phone', ''),
    ('store_logo', ''),
    ('currency', 'دج'),
    ('tax_rate', '0'),
    ('low_stock_threshold', '5'),
    ('language', 'ar'),
    ('theme', 'dark'),
    ('invoice_footer', 'شكراً لتسوقكم معنا'),
    ('backup_path', '');

-- ========================
-- بيانات أولية للفئات
-- ========================
INSERT OR IGNORE INTO categories (id, name, color, icon) VALUES
    (1, 'مواد غذائية', '#10b981', 'ShoppingCart'),
    (2, 'مشروبات', '#3b82f6', 'Coffee'),
    (3, 'منظفات', '#8b5cf6', 'Sparkles'),
    (4, 'إلكترونيات', '#f59e0b', 'Zap'),
    (5, 'ملابس', '#ec4899', 'Tag'),
    (6, 'أخرى', '#6b7280', 'Package');
