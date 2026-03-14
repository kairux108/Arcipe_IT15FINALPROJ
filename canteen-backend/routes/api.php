<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;

// ── Public routes ─────────────────────────────────────────────────────────────
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// ── Authenticated routes ──────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Menu (public read, admin write)
    Route::get('/menu',           [MenuController::class, 'index']);
    Route::get('/menu/{menuItem}', [MenuController::class, 'show']);
    Route::get('/categories',     [MenuController::class, 'categories']);

    Route::middleware('role:admin')->group(function () {
        Route::post('/menu',                          [MenuController::class, 'store']);
        Route::put('/menu/{menuItem}',                [MenuController::class, 'update']);
        Route::delete('/menu/{menuItem}',             [MenuController::class, 'destroy']);
        Route::patch('/menu/{menuItem}/toggle-availability', [MenuController::class, 'toggleAvailability']);
    });

    // Orders
    Route::get('/orders/my',          [OrderController::class, 'myOrders']);     // customer
    Route::post('/orders',            [OrderController::class, 'store']);         // cashier + customer
    Route::get('/orders/{order}',     [OrderController::class, 'show']);

    Route::middleware('role:admin,cashier')->group(function () {
        Route::get('/orders',                        [OrderController::class, 'index']);
        Route::patch('/orders/{order}/status',       [OrderController::class, 'updateStatus']);
    });

    // Inventory
    Route::middleware('role:admin,cashier')->group(function () {
        Route::get('/inventory',                          [InventoryController::class, 'index']);
        Route::get('/inventory/low-stock',                [InventoryController::class, 'lowStock']);
        Route::get('/inventory/logs',                     [InventoryController::class, 'logs']);
        Route::post('/inventory/bulk-restock',            [InventoryController::class, 'bulkRestock']);
        Route::post('/inventory/{menuItem}/restock',      [InventoryController::class, 'restock']);
        Route::post('/inventory/{menuItem}/adjust',       [InventoryController::class, 'adjust']);
    });

    // Reports (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('/reports/sales-summary',    [ReportController::class, 'salesSummary']);
        Route::get('/reports/best-sellers',     [ReportController::class, 'bestSellers']);
        Route::get('/reports/sales-by-category',[ReportController::class, 'salesByCategory']);
        Route::get('/reports/order-trends',     [ReportController::class, 'orderTrends']);
        Route::get('/reports/export-csv',       [ReportController::class, 'exportCsv']);
    });

    // Users (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('/users',                        [UserController::class, 'index']);
        Route::post('/users',                       [UserController::class, 'store']);
        Route::put('/users/{user}',                 [UserController::class, 'update']);
        Route::delete('/users/{user}',              [UserController::class, 'destroy']);
        Route::patch('/users/{user}/toggle-active', [UserController::class, 'toggleActive']); // ✅ ADDED
    });
});