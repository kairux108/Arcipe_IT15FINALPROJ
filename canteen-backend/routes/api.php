<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Canteen Management System
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public menu browsing
Route::get('/menu', [MenuController::class, 'index']);
Route::get('/menu/{menuItem}', [MenuController::class, 'show']);
Route::get('/categories', [MenuController::class, 'categories']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // Orders - Customer & Cashier
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/my', [OrderController::class, 'myOrders']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);

    // Orders - Admin & Cashier
    Route::middleware('role:admin,cashier')->group(function () {
        Route::get('/orders', [OrderController::class, 'index']);
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
        Route::get('/orders-queue', [OrderController::class, 'queue']);
    });

    // Menu Management - Admin only
    Route::middleware('role:admin')->group(function () {
        Route::post('/menu', [MenuController::class, 'store']);
        Route::put('/menu/{menuItem}', [MenuController::class, 'update']);
        Route::delete('/menu/{menuItem}', [MenuController::class, 'destroy']);
        Route::patch('/menu/{menuItem}/toggle-availability', [MenuController::class, 'toggleAvailability']);

        // Categories
        Route::post('/categories', [MenuController::class, 'storeCategory']);
        Route::put('/categories/{category}', [MenuController::class, 'updateCategory']);

        // Reports
        Route::get('/reports/sales-summary', [ReportController::class, 'salesSummary']);
        Route::get('/reports/best-sellers', [ReportController::class, 'bestSellers']);
        Route::get('/reports/sales-by-category', [ReportController::class, 'salesByCategory']);
        Route::get('/reports/order-trends', [ReportController::class, 'orderTrends']);
        Route::get('/reports/export-csv', [ReportController::class, 'exportCsv']);
    });

    // Inventory - Admin & Cashier
    Route::middleware('role:admin,cashier')->group(function () {
        Route::get('/inventory', [InventoryController::class, 'index']);
        Route::post('/inventory/{menuItem}/restock', [InventoryController::class, 'restock']);
        Route::post('/inventory/bulk-restock', [InventoryController::class, 'bulkRestock']);
        Route::get('/inventory/logs', [InventoryController::class, 'logs']);
        Route::get('/inventory/low-stock', [InventoryController::class, 'lowStockAlerts']);
    });

    Route::middleware('role:admin')->group(function () {
        Route::post('/inventory/{menuItem}/adjust', [InventoryController::class, 'adjust']);
    });
});