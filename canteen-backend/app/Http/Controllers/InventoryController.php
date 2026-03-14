<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\InventoryLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MenuItem::with('category')->orderBy('name');

        if ($request->has('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        return response()->json($query->paginate($request->get('per_page', 100)));
    }

    public function lowStock(): JsonResponse
    {
        $items = MenuItem::with('category')
            ->where('stock_quantity', '<=', 15)
            ->orderBy('stock_quantity')
            ->get();

        return response()->json(['items' => $items]);
    }

    public function restock(Request $request, MenuItem $menuItem): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'reason'   => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($validated, $menuItem, $request) {
            $before = $menuItem->stock_quantity;
            $menuItem->increment('stock_quantity', $validated['quantity']);
            $after  = $menuItem->fresh()->stock_quantity;

            if ($before <= 0) {
                $menuItem->update(['is_available' => true]);
            }

            InventoryLog::create([
                'menu_item_id'    => $menuItem->id,
                'user_id'         => $request->user()->id,
                'type'            => 'restock',
                'quantity_change' => $validated['quantity'],
                'reason'          => $validated['reason'] ?? 'Manual restock',
                'quantity_before' => $before,
                'quantity_after'  => $after,
            ]);

            return response()->json([
                'message'      => 'Restocked successfully',
                'menu_item'    => $menuItem->fresh(),
                'stock_before' => $before,
                'stock_after'  => $after,
            ]);
        });
    }

    public function bulkRestock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items'            => 'required|array|min:1',
            'items.*.id'       => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'reason'           => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $results = [];
            foreach ($validated['items'] as $item) {
                $menuItem = MenuItem::findOrFail($item['id']);
                $before   = $menuItem->stock_quantity;
                $menuItem->increment('stock_quantity', $item['quantity']);
                $after    = $menuItem->fresh()->stock_quantity;

                if ($before <= 0) {
                    $menuItem->update(['is_available' => true]);
                }

                InventoryLog::create([
                    'menu_item_id'    => $menuItem->id,
                    'user_id'         => $request->user()->id,
                    'type'            => 'restock',
                    'quantity_change' => $item['quantity'],
                    'reason'          => $validated['reason'] ?? 'Bulk restock',
                    'quantity_before' => $before,
                    'quantity_after'  => $after,
                ]);

                $results[] = ['id' => $menuItem->id, 'name' => $menuItem->name, 'stock_after' => $after];
            }

            return response()->json(['message' => 'Bulk restock successful', 'items' => $results]);
        });
    }

    // ✅ FIX: Accept 'add', 'subtract', 'adjustment', and 'waste' types
    public function adjust(Request $request, MenuItem $menuItem): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'type'     => 'required|in:add,subtract,adjustment,waste',
            'reason'   => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($validated, $menuItem, $request) {
            $before = $menuItem->stock_quantity;
            $type   = $validated['type'];

            // add and adjustment increase stock, subtract and waste decrease stock
            if (in_array($type, ['add', 'adjustment'])) {
                $menuItem->increment('stock_quantity', $validated['quantity']);
                $quantityChange = $validated['quantity'];
            } else {
                // subtract or waste — decrease stock, floor at 0
                $newQty = max(0, $before - $validated['quantity']);
                $menuItem->update(['stock_quantity' => $newQty]);
                $quantityChange = -$validated['quantity'];

                // Mark unavailable if stock hits 0
                if ($newQty <= 0) {
                    $menuItem->update(['is_available' => false]);
                }
            }

            $after = $menuItem->fresh()->stock_quantity;

            // Map frontend type to inventory_logs enum
            $logType = match($type) {
                'add'        => 'adjustment',
                'subtract'   => 'adjustment',
                'adjustment' => 'adjustment',
                'waste'      => 'waste',
            };

            InventoryLog::create([
                'menu_item_id'    => $menuItem->id,
                'user_id'         => $request->user()->id,
                'type'            => $logType,
                'quantity_change' => $quantityChange,
                'reason'          => $validated['reason'] ?? 'Manual adjustment',
                'quantity_before' => $before,
                'quantity_after'  => $after,
            ]);

            return response()->json([
                'message'      => 'Stock adjusted',
                'menu_item'    => $menuItem->fresh(),
                'stock_before' => $before,
                'stock_after'  => $after,
            ]);
        });
    }

    public function logs(Request $request): JsonResponse
    {
        $logs = InventoryLog::with(['menuItem', 'user'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 50));

        return response()->json($logs);
    }
}