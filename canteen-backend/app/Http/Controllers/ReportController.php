<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function salesSummary(Request $request): JsonResponse
    {
        $period   = $request->get('period', 'daily');
        $dateFrom = $request->get('date_from', now()->subDays(30)->toDateString());
        $dateTo   = $request->get('date_to', now()->toDateString());

        $baseQuery = Order::where('status', 'completed')
            ->whereBetween('completed_at', [$dateFrom, $dateTo . ' 23:59:59']);

        // Summary stats
        $summary = (clone $baseQuery)->selectRaw('
            COUNT(*) as total_orders,
            SUM(total) as total_revenue,
            AVG(total) as average_order_value,
            SUM(subtotal) as subtotal_revenue,
            SUM(tax) as total_tax
        ')->first();

        // ✅ FIX: Total items sold
        $totalItemsSold = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'completed')
            ->whereBetween('orders.completed_at', [$dateFrom, $dateTo . ' 23:59:59'])
            ->sum('order_items.quantity');

        $summary->total_items_sold = $totalItemsSold;

        // Revenue by period
        switch ($period) {
            case 'weekly':
                $selectRaw  = "DATE_FORMAT(completed_at, '%x-W%v') as period_label,
                               COUNT(*) as order_count,
                               SUM(total) as revenue";
                $groupByRaw = "YEARWEEK(completed_at, 1)";
                break;
            case 'monthly':
                $selectRaw  = "DATE_FORMAT(completed_at, '%Y-%m') as period_label,
                               COUNT(*) as order_count,
                               SUM(total) as revenue";
                $groupByRaw = "DATE_FORMAT(completed_at, '%Y-%m')";
                break;
            default: // daily
                $selectRaw  = "DATE(completed_at) as period_label,
                               COUNT(*) as order_count,
                               SUM(total) as revenue";
                $groupByRaw = "DATE(completed_at)";
                break;
        }

        $revenueByPeriod = (clone $baseQuery)
            ->selectRaw($selectRaw)
            ->groupByRaw($groupByRaw)
            ->orderBy('period_label')
            ->get();

        return response()->json([
            'summary'           => $summary,
            'revenue_by_period' => $revenueByPeriod,
        ]);
    }

    public function bestSellers(Request $request): JsonResponse
    {
        $dateFrom = $request->get('date_from', now()->subDays(30)->toDateString());
        $dateTo   = $request->get('date_to', now()->toDateString());
        $limit    = $request->get('limit', 10);

        $bestSellers = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->where('orders.status', 'completed')
            ->whereBetween('orders.completed_at', [$dateFrom, $dateTo . ' 23:59:59'])
            ->selectRaw('
                menu_items.id,
                order_items.item_name,
                categories.name as category_name,
                SUM(order_items.quantity) as total_quantity,
                SUM(order_items.subtotal) as total_revenue,
                COUNT(DISTINCT order_items.order_id) as order_count
            ')
            ->groupBy('menu_items.id', 'order_items.item_name', 'categories.name')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get();

        return response()->json($bestSellers);
    }

    public function salesByCategory(Request $request): JsonResponse
    {
        $dateFrom = $request->get('date_from', now()->subDays(30)->toDateString());
        $dateTo   = $request->get('date_to', now()->toDateString());

        $salesByCategory = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->where('orders.status', 'completed')
            ->whereBetween('orders.completed_at', [$dateFrom, $dateTo . ' 23:59:59'])
            ->selectRaw('
                categories.id,
                categories.name as category_name,
                SUM(order_items.quantity) as total_quantity,
                SUM(order_items.subtotal) as total_revenue
            ')
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('total_revenue')
            ->get();

        return response()->json($salesByCategory);
    }

    public function orderTrends(Request $request): JsonResponse
    {
        $days = $request->get('days', 30);

        $trends = Order::where('status', 'completed')
            ->where('completed_at', '>=', now()->subDays($days))
            ->selectRaw('DATE(completed_at) as date, COUNT(*) as order_count, SUM(total) as revenue')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($trends);
    }

    public function exportCsv(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->subDays(30)->toDateString());
        $dateTo   = $request->get('date_to', now()->toDateString());

        $orders = Order::where('status', 'completed')
            ->whereBetween('completed_at', [$dateFrom, $dateTo . ' 23:59:59'])
            ->with(['items', 'user'])
            ->get();

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="sales-report-' . $dateFrom . '-to-' . $dateTo . '.csv"',
        ];

        $callback = function () use ($orders) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Order Number', 'Date', 'Customer', 'Items', 'Subtotal', 'Tax', 'Total', 'Payment Method', 'Status']);

            foreach ($orders as $order) {
                $items = $order->items->map(fn($i) => "{$i->item_name} x{$i->quantity}")->join(', ');
                fputcsv($file, [
                    $order->order_number,
                    $order->completed_at->format('Y-m-d H:i:s'),
                    $order->user?->name ?? 'Walk-in',
                    $items,
                    $order->subtotal,
                    $order->tax,
                    $order->total,
                    $order->payment_method,
                    $order->status,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}