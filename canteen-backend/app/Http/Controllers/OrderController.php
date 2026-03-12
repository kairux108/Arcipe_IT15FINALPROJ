<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use App\Models\InventoryLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    // ── GET /api/orders ──────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['user', 'items.menuItem'])
            ->orderBy('created_at', 'desc');

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $orders = $query->paginate($request->get('per_page', 200));

        return response()->json($orders);
    }

    // ── GET /api/orders/my ───────────────────────────────────────────────────
    public function myOrders(Request $request): JsonResponse
    {
        $orders = Order::with(['items.menuItem'])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 200));

        return response()->json($orders);
    }

    // ── GET /api/orders/{order} ──────────────────────────────────────────────
    public function show(Order $order): JsonResponse
    {
        return response()->json($order->load(['user', 'items.menuItem']));
    }

    // ── PATCH /api/orders/{order}/status ─────────────────────────────────────
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,preparing,ready,completed,cancelled',
            'notes'  => 'nullable|string',
        ]);

        $order->update([
            'status'       => $validated['status'],
            'notes'        => $validated['notes'] ?? $order->notes,
            'completed_at' => in_array($validated['status'], ['completed', 'cancelled'])
                ? now()
                : $order->completed_at,
        ]);

        return response()->json($order->load(['user', 'items.menuItem']));
    }

    // ── POST /api/orders ─────────────────────────────────────────────────────
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items'                => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity'     => 'required|integer|min:1',
            'payment_method'       => 'required|in:cash,card,digital_wallet',
            'amount_paid'          => 'required|numeric|min:0',
            'notes'                => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $subtotal  = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $menuItem = MenuItem::findOrFail($item['menu_item_id']);

                if ($menuItem->stock_quantity < $item['quantity']) {
                    abort(422, "Insufficient stock for: {$menuItem->name}. Only {$menuItem->stock_quantity} left.");
                }

                $lineTotal  = $menuItem->price * $item['quantity'];
                $subtotal  += $lineTotal;

                $itemsData[] = [
                    'menu_item' => $menuItem,
                    'quantity'  => $item['quantity'],
                    'price'     => $menuItem->price,
                    'subtotal'  => $lineTotal,
                ];
            }

            $tax         = $subtotal * 0.12;
            $totalAmount = $subtotal + $tax;
            $amountPaid  = $validated['payment_method'] === 'cash'
                ? $validated['amount_paid']
                : $totalAmount;
            $change      = max(0, $amountPaid - $totalAmount);

            // Generate Order Number
            $lastOrder   = Order::latest()->first();
            $nextNumber  = $lastOrder ? $lastOrder->id + 1 : 1;
            $orderNumber = 'ORD-' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

            // Create Order
            $order = Order::create([
                'order_number'   => $orderNumber,
                'user_id'        => $request->user()->id,
                'status'         => 'pending',
                'subtotal'       => $subtotal,
                'tax'            => $tax,
                'total'          => $totalAmount,
                'payment_method' => $validated['payment_method'],
                'amount_paid'    => $amountPaid,
                'change_given'   => $change,
                'notes'          => $validated['notes'] ?? null,
            ]);

            foreach ($itemsData as $item) {
                $currentMenuItem = $item['menu_item'];

                OrderItem::create([
                    'order_id'     => $order->id,
                    'menu_item_id' => $currentMenuItem->id,
                    'item_name'    => $currentMenuItem->name,
                    'quantity'     => $item['quantity'],
                    'unit_price'   => $item['price'],
                    'subtotal'     => $item['subtotal'],
                ]);

                $stockBefore = $currentMenuItem->stock_quantity;
                $currentMenuItem->decrement('stock_quantity', $item['quantity']);
                $stockAfter = $currentMenuItem->fresh()->stock_quantity;

                InventoryLog::create([
                    'menu_item_id'    => $currentMenuItem->id,
                    'user_id'         => $request->user()->id,
                    'type'            => 'deduction',
                    'quantity_before' => $stockBefore,
                    'quantity_change' => $item['quantity'],
                    'quantity_after'  => $stockAfter,
                    'reason'          => "Order #{$order->order_number}",
                    'order_id'        => $order->id,
                ]);

                if ($stockAfter <= 0) {
                    $currentMenuItem->update(['is_available' => false]);
                }
            }

            return response()->json($order->load('items.menuItem'), 201);
        });
    }
}