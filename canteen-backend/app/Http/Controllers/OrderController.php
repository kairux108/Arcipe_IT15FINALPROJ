<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['items', 'user', 'cashier']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $orders = $query->latest()->paginate($request->get('per_page', 20));

        return response()->json($orders);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.special_instructions' => 'nullable|string',
            'payment_method' => 'required|in:cash,card,digital_wallet',
            'amount_paid' => 'required_if:payment_method,cash|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $subtotal = 0;
            $orderItems = [];

            foreach ($validated['items'] as $itemData) {
                $menuItem = MenuItem::findOrFail($itemData['menu_item_id']);

                if (!$menuItem->is_available) {
                    return response()->json([
                        'message' => "{$menuItem->name} is currently unavailable.",
                    ], 422);
                }

                if ($menuItem->stock_quantity < $itemData['quantity']) {
                    return response()->json([
                        'message' => "Insufficient stock for {$menuItem->name}. Available: {$menuItem->stock_quantity}",
                    ], 422);
                }

                $itemSubtotal = $menuItem->price * $itemData['quantity'];
                $subtotal += $itemSubtotal;

                $orderItems[] = [
                    'menuItem' => $menuItem,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $menuItem->price,
                    'subtotal' => $itemSubtotal,
                    'special_instructions' => $itemData['special_instructions'] ?? null,
                ];
            }

            $tax = $subtotal * 0.12; // 12% VAT
            $total = $subtotal + $tax;
            $amountPaid = $validated['amount_paid'] ?? $total;
            $changeGiven = max(0, $amountPaid - $total);

            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => $request->user()->id,
                'cashier_id' => $request->user()->isCashier() ? $request->user()->id : null,
                'status' => 'pending',
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
                'amount_paid' => $amountPaid,
                'change_given' => $changeGiven,
                'payment_method' => $validated['payment_method'],
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($orderItems as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $item['menuItem']->id,
                    'item_name' => $item['menuItem']->name,
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'subtotal' => $item['subtotal'],
                    'special_instructions' => $item['special_instructions'],
                ]);

                $item['menuItem']->decreaseStock(
                    $item['quantity'],
                    $order->id,
                    $request->user()->id
                );
            }

            return response()->json([
                'message' => 'Order placed successfully',
                'data' => $order->load(['items', 'user', 'cashier']),
            ], 201);
        });
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json($order->load(['items.menuItem', 'user', 'cashier']));
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,preparing,ready,completed,cancelled',
        ]);

        if (!$order->canTransitionTo($validated['status'])) {
            return response()->json([
                'message' => "Cannot transition from '{$order->status}' to '{$validated['status']}'",
            ], 422);
        }

        $updateData = ['status' => $validated['status']];

        if ($validated['status'] === 'completed') {
            $updateData['completed_at'] = now();
        }

        $order->update($updateData);

        return response()->json([
            'message' => 'Order status updated',
            'data' => $order->fresh()->load(['items', 'user', 'cashier']),
        ]);
    }

    public function myOrders(Request $request): JsonResponse
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with('items')
            ->latest()
            ->paginate(10);

        return response()->json($orders);
    }

    public function queue(): JsonResponse
    {
        $orders = Order::whereIn('status', ['pending', 'preparing', 'ready'])
            ->with(['items.menuItem'])
            ->orderBy('created_at')
            ->get();

        return response()->json($orders);
    }
}