# 🍽️ Inventopia — Canteen Management System

A full-stack Canteen Management System built with **React.js** (frontend) and **Laravel** (backend) for IT15/L Integrative Programming Final Project.

---

## 🚀 Features

### 👤 Role-Based Access
| Role | Access |
|------|--------|
| **Admin** | Full access — dashboard, menu, orders, inventory, reports, user management |
| **Cashier** | POS interface, order queue, basic inventory view |
| **Customer** | Browse menu, place orders, track order status |

### 📋 Modules
- **Authentication** — Secure login with Laravel Sanctum, protected routes, session management
- **Menu Management** — CRUD for menu items with image upload, category filter, availability toggle
- **Order Processing** — POS interface with cash/card/e-wallet, order queue with status flow, customer order tracking
- **Inventory Management** — Real-time stock tracking, low-stock alerts, restock, inventory log
- **Sales Reports** — Bar/Pie/Line charts (Recharts), date range filter, CSV export

---

## 🛠️ Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React.js | 18.x |
| Build Tool | Vite | 5.x |
| UI Framework | Bootstrap | 5.3.3 |
| Charts | Recharts | 2.x |
| Backend | Laravel | 11.x |
| Authentication | Laravel Sanctum | 4.x |
| Database | MySQL | 8.x |
| HTTP Client | Axios | 1.x |

---

## 📁 Project Structure

```
├── canteen-backend/          # Laravel API
│   ├── app/
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── MenuItem.php
│   │   │   ├── Category.php
│   │   │   ├── Order.php
│   │   │   ├── OrderItem.php
│   │   │   └── InventoryLog.php
│   │   └── Http/
│   │       ├── Controllers/
│   │       │   ├── AuthController.php
│   │       │   ├── MenuController.php
│   │       │   ├── OrderController.php
│   │       │   ├── InventoryController.php
│   │       │   ├── ReportController.php
│   │       │   └── UserController.php
│   │       └── Middleware/
│   │           └── RoleMiddleware.php
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   │       └── DatabaseSeeder.php
│   └── routes/api.php
│
└── canteen-frontend/         # React App
    └── src/
        ├── Components/
        │   ├── Auth/          Login.jsx, ProtectedRoute.jsx
        │   ├── Dashboard/     AdminDashboard.jsx, SalesChart.jsx, CategoryPieChart.jsx, OrderTrendChart.jsx
        │   ├── Menu/          MenuList.jsx, MenuItemCard.jsx, MenuForm.jsx
        │   ├── Orders/        POSInterface.jsx, OrderQueue.jsx, OrderReceipt.jsx
        │   ├── Inventory/     InventoryTable.jsx, InventoryLogPage.jsx, LowStockAlert.jsx
        │   ├── user/          UserManagement.jsx
        │   ├── customer/      BrowseMenu.jsx, MyOrders.jsx
        │   ├── reports/       SalesReport.jsx
        │   └── Common/        Sidebar.jsx, Navbar.jsx, LoadingSpinner.jsx, ErrorBoundary.jsx
        ├── Context/           AuthContext.jsx, CartContext.jsx, ThemeContext.jsx
        ├── Services/          api.js, authService.js, orderService.js
        ├── layouts/           AppLayout.jsx
        └── App.jsx
```

---

## ⚙️ Setup & Installation

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- MySQL 8.x

---

### Backend Setup (Laravel)

```bash
cd canteen-backend

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure your database in .env
# DB_DATABASE=canteen_db
# DB_USERNAME=root
# DB_PASSWORD=

# Run migrations and seed dummy data
php artisan migrate --seed

# Create storage symlink for image uploads
php artisan storage:link

# Start the development server
php artisan serve
```

Backend runs at: `http://localhost:8000`

---

### Frontend Setup (React)

```bash
cd canteen-frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start the development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@canteen.com | password |
| Cashier | cashier@canteen.com | password |
| Customer | customer@canteen.com | password |

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Login and get token |
| POST | `/api/logout` | Logout |
| GET | `/api/user` | Get authenticated user |

### Menu
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | List menu items (filterable) |
| POST | `/api/menu` | Create menu item (with image) |
| GET | `/api/menu/{id}` | Get single item |
| PUT | `/api/menu/{id}` | Update menu item |
| DELETE | `/api/menu/{id}` | Delete menu item |
| PATCH | `/api/menu/{id}/toggle` | Toggle availability |
| GET | `/api/categories` | List categories |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List all orders (admin/cashier) |
| POST | `/api/orders` | Create new order |
| GET | `/api/orders/{id}` | Get single order |
| PATCH | `/api/orders/{id}/status` | Update order status |
| GET | `/api/orders/my` | Customer's own orders |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | List all inventory |
| GET | `/api/inventory/low-stock` | Low stock alerts |
| POST | `/api/inventory/{id}/restock` | Restock item |
| POST | `/api/inventory/bulk-restock` | Bulk restock |
| POST | `/api/inventory/{id}/adjust` | Manual adjustment |
| GET | `/api/inventory/logs` | Inventory change log |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/sales-summary` | Sales totals by period |
| GET | `/api/reports/best-sellers` | Top items by qty/revenue |
| GET | `/api/reports/order-trends` | Order volume over time |
| GET | `/api/reports/sales-by-category` | Category breakdown |
| GET | `/api/reports/export-csv` | Export to CSV |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user |

---

## 🗄️ Database Schema

### Tables
- **users** — id, name, email, password, role (admin/cashier/customer)
- **categories** — id, name, slug, description
- **menu_items** — id, category_id, name, slug, description, price, image_url, is_available, stock_quantity, low_stock_threshold, preparation_time
- **orders** — id, user_id, order_number, status, payment_method, subtotal, tax, total, amount_paid, change_given, notes
- **order_items** — id, order_id, menu_item_id, item_name, unit_price, quantity, subtotal
- **inventory_logs** — id, menu_item_id, user_id, order_id, type, quantity_before, quantity_change, quantity_after, reason

### Order Status Flow
```
pending → preparing → ready → completed
                    ↘ cancelled
```

---

## 🌱 Seeded Data
- 3 users (admin, cashier, customer)
- 5 categories (Meals, Snacks, Beverages, Desserts, Combos)
- 33 menu items with stock quantities
- 220+ orders with order items

---

## 🔒 Security
- Laravel Sanctum for API token authentication
- Role-based middleware protecting all API routes
- CORS configured for frontend origin
- Environment variables for all sensitive credentials
- Input validation on all API endpoints

---

## 📦 Environment Variables

### Backend (`canteen-backend/.env`)
```env
APP_NAME=Inventopia
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=canteen_db
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DRIVER=cookie
FRONTEND_URL=http://localhost:3000
```

### Frontend (`canteen-frontend/.env`)
```env
VITE_API_URL=http://localhost:8000/api
```

---

## 👨‍💻 Developers

**Justine Kylle B. Arcipe**
**Justine Kylle B. Arcipe**
**Justine Kylle B. Arcipe**
**Justine Kylle B. Arcipe**
IT15/L — Integrative Programming
Final Project — Canteen Management System