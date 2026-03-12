<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class MenuController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MenuItem::with('category');

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('available') && $request->available === 'true') {
            $query->where('is_available', true)->where('stock_quantity', '>', 0);
        }

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $perPage = $request->get('per_page', 20);
        $items = $query->orderBy('name')->paginate($perPage);

        return response()->json($items);
    }

    public function show(MenuItem $menuItem): JsonResponse
    {
        return response()->json($menuItem->load('category'));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'                => 'required|string|max:255',
            'category_id'         => 'required|exists:categories,id',
            'description'         => 'nullable|string',
            'price'               => 'required|numeric|min:0',
            'stock_quantity'      => 'nullable|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'preparation_time'    => 'nullable|integer|min:1',
            'is_available'        => 'nullable|boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . time();
        $validated['stock_quantity']      = $validated['stock_quantity'] ?? 0;
        $validated['low_stock_threshold'] = $validated['low_stock_threshold'] ?? 10;
        $validated['preparation_time']    = $validated['preparation_time'] ?? 5;
        $validated['is_available']        = $validated['is_available'] ?? true;

        $item = MenuItem::create($validated);

        return response()->json([
            'message' => 'Menu item created successfully',
            'data'    => $item->load('category'),
        ], 201);
    }

    public function update(Request $request, MenuItem $menuItem): JsonResponse
    {
        $validated = $request->validate([
            'name'                => 'sometimes|string|max:255',
            'category_id'         => 'sometimes|exists:categories,id',
            'description'         => 'nullable|string',
            'price'               => 'sometimes|numeric|min:0',
            'stock_quantity'      => 'nullable|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'preparation_time'    => 'nullable|integer|min:1',
            'is_available'        => 'nullable|boolean',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']) . '-' . time();
        }

        $menuItem->update($validated);

        return response()->json([
            'message' => 'Menu item updated successfully',
            'data'    => $menuItem->fresh()->load('category'),
        ]);
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        $menuItem->delete();

        return response()->json([
            'message' => 'Menu item deleted successfully',
        ]);
    }

    public function toggleAvailability(MenuItem $menuItem): JsonResponse
    {
        $menuItem->update([
            'is_available' => !$menuItem->is_available,
        ]);

        return response()->json([
            'message'      => 'Availability updated',
            'is_available' => $menuItem->is_available,
            'data'         => $menuItem->fresh()->load('category'),
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = \App\Models\Category::withCount('menuItems')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }
}