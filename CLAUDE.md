# CLAUDE.md — StockFlow (مخزني)

Desktop inventory management application built with Tauri 2, React 19, and Rust.

## Project Overview

**StockFlow** (مخزني — "My Store") is an offline-first, Arabic-primary point-of-sale and inventory management app for small businesses. It runs as a native desktop app via Tauri with a SQLite database stored locally on the user's machine.

- **Version**: 0.1.0
- **Target platforms**: Desktop (Windows/macOS/Linux via Tauri), then Web/Mobile
- **Primary language**: Arabic (RTL), with English and French locales
- **Architecture**: Tauri 2 (Rust backend) + React 19 + TypeScript frontend

---

## Tech Stack

### Frontend
| Layer | Library |
|---|---|
| Framework | React 19 + TypeScript 5.8 |
| Build | Vite 7 |
| Routing | React Router 7 |
| State | Zustand 5 (persistent via localStorage) |
| Server state | TanStack React Query 5 (staleTime: 30s) |
| Forms | React Hook Form 7 + Zod 4 |
| UI components | Radix UI primitives + Shadcn/ui |
| Styling | Tailwind CSS 3 (dark mode via `class`) |
| Icons | Lucide React |
| i18n | i18next 26 + react-i18next |
| Charts | Recharts 3 |
| Notifications | Sonner 2 (RTL, top-center) |
| PDF | jsPDF 4 + jspdf-autotable |
| Excel | XLSX 0.18 |
| Dates | date-fns 4 |

### Backend
| Layer | Library |
|---|---|
| Shell | Tauri 2 |
| Language | Rust (stable) |
| Database | SQLite via rusqlite 0.31 (bundled) |
| Serialization | serde + serde_json |
| Platform dirs | dirs 5 |

---

## Directory Structure

```
monjed154/
├── src/                        # React/TypeScript frontend
│   ├── App.tsx                 # Router, QueryClient, ThemeProvider, Toaster
│   ├── main.tsx                # React entry point
│   ├── components/
│   │   ├── layout/             # AppShell, Header, Sidebar
│   │   └── ui/                 # Shadcn/ui components (Button, Dialog, etc.)
│   ├── pages/                  # One folder per route
│   │   ├── Dashboard/          # → /
│   │   ├── Inventory/          # → /inventory
│   │   ├── Sales/
│   │   │   ├── index.tsx       # → /sales (history)
│   │   │   └── POS.tsx         # → /pos  (point of sale)
│   │   ├── Customers/          # → /customers
│   │   ├── Debts/              # → /debts
│   │   ├── Reports/            # → /reports
│   │   └── Settings/           # → /settings
│   ├── services/
│   │   └── tauriBridge.ts      # All Tauri IPC calls — single source of truth
│   ├── stores/
│   │   ├── cartStore.ts        # Zustand: POS shopping cart
│   │   └── settingsStore.ts    # Zustand: theme, language (persisted)
│   ├── types/
│   │   └── index.ts            # All TypeScript interfaces (canonical types)
│   ├── lib/
│   │   └── i18n.ts             # i18next initialization
│   ├── utils/                  # Formatting helpers (currency, dates)
│   ├── locales/
│   │   ├── ar.json             # Arabic (primary, most complete)
│   │   ├── en.json             # English
│   │   └── fr.json             # French
│   └── assets/                 # Static images/fonts
├── src-tauri/                  # Rust/Tauri backend
│   ├── src/
│   │   ├── main.rs             # Tauri app bootstrap
│   │   ├── lib.rs              # All 44 Tauri commands + models (~1444 lines)
│   │   └── db/
│   │       └── schema.sql      # SQLite schema + seed data
│   ├── Cargo.toml              # Rust dependencies
│   ├── tauri.conf.json         # Tauri app config (identifier, window, build)
│   ├── capabilities/           # Tauri permission manifests
│   ├── build.rs                # Tauri build script
│   └── icons/                  # App icons (all sizes)
├── public/                     # Static assets served by Vite
├── package.json
├── vite.config.ts              # Path alias @ → ./src, HMR port 1421
├── tailwind.config.js          # Dark mode, Cairo font, custom colors
├── tsconfig.json               # Strict mode, ES2020 target
└── .gitignore
```

---

## Development Commands

```bash
# Frontend dev server only (port 1420)
npm run dev

# Full Tauri desktop app in dev mode
npm run tauri dev

# Type-check + build frontend
npm run build

# Build desktop distributable
npm run tauri build

# Preview built frontend
npm run preview
```

> There is no linting, testing, or pre-commit tooling configured. TypeScript strict mode is the primary correctness check.

---

## Architecture: Frontend ↔ Backend IPC

All communication between the React frontend and the Rust backend goes through **Tauri commands** (IPC). The single abstraction layer is:

```
src/services/tauriBridge.ts  →  invoke("command_name", { args })
```

Never call `invoke()` directly in components or pages — always go through `tauriBridge.ts`. This keeps the IPC surface discoverable and typed.

### Adding a new command

1. **Rust** (`src-tauri/src/lib.rs`): Define a `#[tauri::command]` function returning `Result<T, String>`.
2. **Rust** (`src-tauri/src/lib.rs`): Register it in the `tauri::Builder` `.invoke_handler(tauri::generate_handler![...])` call.
3. **TypeScript** (`src/services/tauriBridge.ts`): Add a typed wrapper using `invoke<ReturnType>`.
4. **TypeScript** (`src/types/index.ts`): Add any new interface if needed.

### Backend state

The SQLite connection is held in `DbState(pub Mutex<Connection>)` and injected into every command via Tauri's managed state. Commands receive it as `state: tauri::State<'_, DbState>`.

---

## Database Schema

SQLite file is created automatically on first launch in the platform's app data directory (via the `dirs` crate). Schema is applied at startup from `src-tauri/src/db/schema.sql`.

### Tables

| Table | Purpose |
|---|---|
| `categories` | Product categories (color, icon) |
| `products` | Inventory items (barcode, pricing, stock qty) |
| `stock_movements` | Audit log for IN/OUT/ADJUST operations |
| `customers` | Customer profiles (credit limit, balance) |
| `sales` | Invoice headers (payment method, discount, status) |
| `sale_items` | Line items per invoice (price snapshot) |
| `debts` | Outstanding customer balances |
| `debt_payments` | Payment records against debts |
| `settings` | Key-value store for app configuration |

### Key constraints
- `products.barcode` is UNIQUE (nullable).
- `sale_items` cascade-delete with their parent `sales` row.
- `sales.status` ∈ `{COMPLETED, CANCELLED, REFUNDED}`.
- `stock_movements.type` ∈ `{IN, OUT, ADJUST}`.
- `debts.status` ∈ `{PENDING, PARTIAL, PAID, CANCELLED}`.
- `sales.payment_method` ∈ `{CASH, DEBT, PARTIAL}`.

### Seed data
Default categories (food, drinks, cleaning, electronics, clothing, other) and settings (currency = `دج`, language = `ar`, theme = `dark`) are inserted with `INSERT OR IGNORE` on startup.

---

## Tauri Commands Reference

All 44 commands are in `src-tauri/src/lib.rs`. Grouped by domain:

| Domain | Commands |
|---|---|
| Categories | `get_categories`, `add_category` |
| Products | `get_products`, `get_product`, `get_product_by_barcode`, `add_product`, `update_product`, `delete_product`, `adjust_stock` |
| Customers | `get_customers`, `get_customer`, `add_customer`, `update_customer`, `delete_customer` |
| Sales | `get_sales`, `get_sale`, `create_sale`, `cancel_sale` |
| Debts | `get_debts`, `get_customer_debts`, `add_debt_payment` |
| Reports | `get_dashboard_stats`, `get_sales_chart`, `get_top_products`, `get_stock_movements` |
| Settings | `get_settings`, `update_setting`, `update_settings` |

---

## State Management

### Zustand stores (client-only)

- **`settingsStore`** — theme (`dark`|`light`) and language (`ar`|`en`|`fr`). Persisted to localStorage. The `ThemeProvider` in `App.tsx` reads theme and toggles `document.documentElement.classList`.
- **`cartStore`** — POS cart items. Used only on the `/pos` route.

### React Query (server state)

All data fetched from Tauri commands goes through React Query. Default config in `App.tsx`:
- `staleTime: 30_000` (30 seconds)
- `retry: 1`

After mutations (create/update/delete), always call `queryClient.invalidateQueries()` for the affected query keys to keep the UI consistent.

---

## Routing

All routes are nested under `<AppShell>` (the main layout with sidebar + header):

| Path | Page | Description |
|---|---|---|
| `/` | Dashboard | KPI cards, sales chart (7/30/90 days), low stock alerts |
| `/inventory` | Inventory | Product CRUD, stock adjustment, category filter |
| `/pos` | POS | Shopping cart, payment, invoice creation |
| `/sales` | Sales | Invoice history, search, date filter, cancel |
| `/customers` | Customers | Customer CRUD, debt overview |
| `/debts` | Debts | Debt list, payment recording |
| `/reports` | Reports | Analytics, top products, export (PDF/Excel) |
| `/settings` | Settings | Store info, currency, theme, language, backup |

---

## Internationalization (i18n)

- Configured in `src/lib/i18n.ts` using i18next.
- Default language: **Arabic (`ar`)** — the most complete locale file.
- Locale files: `src/locales/{ar,en,fr}.json`.
- RTL layout is always active (the app is designed RTL-first). The Sonner toaster uses `dir="rtl"`.
- When adding new UI strings, add keys to all three locale files. Arabic must always be complete; English and French may be partial.

---

## Styling Conventions

- **Tailwind CSS** with dark mode via the `class` strategy.
- Custom CSS variables for semantic colors (`--background`, `--primary`, `--success`, `--warning`, etc.) defined in the global CSS.
- Color palette: Indigo primary (`#6366f1`), green success (`#10b981`), amber warning (`#f59e0b`).
- Font: **Cairo** (Arabic-optimized) for all text.
- Components use Shadcn/ui primitives (Radix-based). Add new UI components under `src/components/ui/`.
- Use `cn()` (from `src/lib/utils.ts`) for conditional class merging — never string concatenation.

---

## TypeScript Conventions

- All domain interfaces are defined in `src/types/index.ts` — do not scatter type definitions across files.
- The Rust models in `lib.rs` and the TS interfaces in `types/index.ts` must stay in sync. If you change a Rust struct field, update the corresponding TS interface and vice versa.
- Strict mode is enabled. Avoid `any`; use `unknown` and narrow it.
- Optional fields use `?` on both Rust (`Option<T>`) and TS sides.

---

## Rust Conventions

- All Tauri commands return `Result<T, String>` — convert errors with `.map_err(|e| e.to_string())`.
- The `DbState` mutex must be locked with `.lock().unwrap()` and used within the same scope to avoid deadlocks.
- SQL queries use named parameters (`:name` style) via `rusqlite`.
- New models: derive `Serialize`, `Deserialize`, `Debug`, and `Clone` where appropriate.
- No `unwrap()` in command functions — propagate errors via `?` and the `Result` return type.

---

## What Does NOT Exist Yet

The following are absent and should not be assumed:
- No automated tests (no Vitest, Jest, or Rust `#[test]` modules).
- No linting/formatting config (no ESLint, Prettier, Clippy CI step).
- No CI/CD (no `.github/workflows/`).
- No environment variables / `.env` files.
- No Docker or containerization.
- No pre-commit hooks.

---

## Key File Quick Reference

| What | Where |
|---|---|
| All TypeScript types | `src/types/index.ts` |
| All Tauri IPC calls | `src/services/tauriBridge.ts` |
| All Rust commands + models | `src-tauri/src/lib.rs` |
| Database schema + seed | `src-tauri/src/db/schema.sql` |
| App routes | `src/App.tsx` |
| POS cart state | `src/stores/cartStore.ts` |
| Theme/language state | `src/stores/settingsStore.ts` |
| i18n setup | `src/lib/i18n.ts` |
| Arabic translations | `src/locales/ar.json` |
| Tauri app config | `src-tauri/tauri.conf.json` |
| Rust dependencies | `src-tauri/Cargo.toml` |
| npm scripts | `package.json` |
