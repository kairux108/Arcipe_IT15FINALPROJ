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
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['user', 'items.menuItem'])
            ->orderBy('created_at', 'desc');

        // Only filter by status IF the request actually sends one
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $orders = $query->paginate($request->get('per_page', 200));

        return response()->json($orders);
    }

    public function myOrders(Request $request): JsonResponse
    {
        $orders = Order::with(['items.menuItem'])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 200));

        return response()->json($orders);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items'          => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity'     => 'required|integer|min:1',
            'payment_method' => 'required|in:cash,card,digital_wallet',
            'amount_paid'    => 'required|numeric|min:0',
            'notes'          => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($validated, $request) {

            // ── 1. Calculate totals ──────────────────────────────────────
            $subtotal = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $menuItem = MenuItem::findOrFail($item['menu_item_id']);

                // ✅ Check stock availability
                if ($menuItem->stock_quantity < $item['quantity']) {
                    abort(422, "Insufficient stock for: {$menuItem->name}. Only {$menuItem->stock_quantity} left.");
                }

                $lineTotal = $menuItem->price * $item['quantity'];
                $subtotal += $lineTotal;

                $itemsData[] = [
                    'menu_item'  => $menuItem,
                    'quantity'   => $item['quantity'],
                    'price'      => $menuItem->price,
                    'subtotal'   => $lineTotal,
                ];
            }

            $tax         = $subtotal * 0.12;
            $totalAmount = $subtotal + $tax;
            $amountPaid  = $validated['payment_method'] === 'cash'
                ? $validated['amount_paid']
                : $totalAmount;
            $change      = max(0, $amountPaid - $totalAmount);

            // ── 2. Create the order ──────────────────────────────────────
            $order = Order::create([
                'user_id'        => $request->user()->id,
                'status'         => 'pending',
                'subtotal'       => $subtotal,
                'tax'            => $tax,
                'total_amount'   => $totalAmount,
                'payment_method' => $validated['payment_method'],
                'amount_paid'    => $amountPaid,
                'change_given'   => $change,
                'notes'          => $validated['notes'] ?? null,
            ]);

            // ── 3. Create order items + auto-deduct inventory ────────────
            foreach ($itemsData as $item) {
                OrderItem::create([
                    'order_id'     => $order->id,
                    'menu_item_id' => $item['menu_item']->id,
                    'quantity'     => $item['quantity'],
                    'price'        => $item['price'],
                    'subtotal'     => $item['subtotal'],
                ]);

                // ✅ AUTO-DEDUCT: subtract stock
                $item['menu_item']->decrement('stock_quantity', $item['quantity']);

                // ✅ AUTO-DEDUCT: log the stock change
                InventoryLog::create([
                    'menu_item_id' => $item['menu_item']->id,
                    'user_id'      => $request->user()->id,
                    'type'         => 'deduct',
                    'quantity'     => $item['quantity'],
                    'reason'       => "Order #{$order->id}",
                    'stock_before' => $item['menu_item']->stock_quantity + $item['quantity'],
                    'stock_after'  => $item['menu_item']->stock_quantity,
                ]);

                // ✅ Auto-mark unavailable if out of stock
                if ($item['menu_item']->fresh()->stock_quantity <= 0) {
                    $item['menu_item']->update(['is_available' => false]);
                }
            }

            // ── 4. Return order with items ───────────────────────────────
            return response()->json(
                $order->load('items.menuItem'),
                201
            );
        });
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json($order->load(['user', 'items.menuItem']));
    }

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
}