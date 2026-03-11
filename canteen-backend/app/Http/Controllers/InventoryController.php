<?php

namespace App\Http\Controllers;

use App\Models\InventoryLog;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MenuItem::with('category')->select([
            'id', 'name', 'category_id', 'stock_quantity',
            'low_stock_threshold', 'is_available', 'price',
        ]);

        if ($request->has('low_stock') && $request->low_stock === 'true') {
            $query->whereRaw('stock_quantity <= low_stock_threshold');
        }

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $items = $query->orderBy('stock_quantity')->paginate($request->get('per_page', 20));

        return response()->json($items);
    }

    public function restock(Request $request, MenuItem $menuItem): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:255',
        ]);

        $menuItem->increaseStock(
            $validated['quantity'],
            $validated['reason'] ?? 'Manual restock',
            $request->user()->id
        );

        return response()->json([
            'message' => 'Stock updated successfully',
            'data' => $menuItem->fresh(),
        ]);
    }

    public function bulkRestock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated, $request) {
            foreach ($validated['items'] as $item) {
                $menuItem = MenuItem::find($item['menu_item_id']);
                $menuItem->increaseStock(
                    $item['quantity'],
                    $validated['reason'] ?? 'Bulk restock',
                    $request->user()->id
                );
            }
        });

        return response()->json(['message' => 'Bulk restock completed']);
    }

    public function adjust(Request $request, MenuItem $menuItem): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer',
            'reason' => 'required|string|max:255',
        ]);

        $before = $menuItem->stock_quantity;
        $newQuantity = max(0, $before + $validated['quantity']);

        InventoryLog::create([
            'menu_item_id' => $menuItem->id,
            'user_id' => $request->user()->id,
            'type' => 'adjustment',
            'quantity_before' => $before,
            'quantity_change' => $validated['quantity'],
            'quantity_after' => $newQuantity,
            'reason' => $validated['reason'],
        ]);

        $menuItem->update([
            'stock_quantity' => $newQuantity,
            'is_available' => $newQuantity > 0,
        ]);

        return response()->json([
            'message' => 'Stock adjusted',
            'data' => $menuItem->fresh(),
        ]);
    }

    public function logs(Request $request): JsonResponse
    {
        $query = InventoryLog::with(['menuItem', 'user', 'order'])
            ->latest();

        if ($request->has('menu_item_id')) {
            $query->where('menu_item_id', $request->menu_item_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $logs = $query->paginate($request->get('per_page', 30));

        return response()->json($logs);
    }

    public function lowStockAlerts(): JsonResponse
    {
        $items = MenuItem::with('category')
            ->whereRaw('stock_quantity <= low_stock_threshold')
            ->where('is_available', true)
            ->orderBy('stock_quantity')
            ->get();

        return response()->json([
            'count' => $items->count(),
            'items' => $items,
        ]);
    }
}