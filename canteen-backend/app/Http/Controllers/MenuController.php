<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MenuController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MenuItem::with('category');

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('available') && $request->available === 'true') {
            $query->where('is_available', true);
        }

        $items = $query->orderBy('name')->paginate($request->get('per_page', 20));

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|image|max:2048',
            'is_available' => 'boolean',
            'stock_quantity' => 'integer|min:0',
            'low_stock_threshold' => 'integer|min:0',
            'preparation_time' => 'integer|min:1',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('menu-items', 'public');
        }

        $item = MenuItem::create($validated);
        $item->load('category');

        return response()->json(['message' => 'Menu item created', 'data' => $item], 201);
    }

    public function show(MenuItem $menuItem): JsonResponse
    {
        return response()->json($menuItem->load('category'));
    }

    public function update(Request $request, MenuItem $menuItem): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'image' => 'nullable|image|max:2048',
            'is_available' => 'sometimes|boolean',
            'stock_quantity' => 'sometimes|integer|min:0',
            'low_stock_threshold' => 'sometimes|integer|min:0',
            'preparation_time' => 'sometimes|integer|min:1',
        ]);

        if ($request->hasFile('image')) {
            if ($menuItem->image) {
                Storage::disk('public')->delete($menuItem->image);
            }
            $validated['image'] = $request->file('image')->store('menu-items', 'public');
        }

        $menuItem->update($validated);

        return response()->json(['message' => 'Menu item updated', 'data' => $menuItem->fresh()->load('category')]);
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        if ($menuItem->image) {
            Storage::disk('public')->delete($menuItem->image);
        }

        $menuItem->delete();

        return response()->json(['message' => 'Menu item deleted']);
    }

    public function toggleAvailability(MenuItem $menuItem): JsonResponse
    {
        $menuItem->update(['is_available' => !$menuItem->is_available]);

        return response()->json([
            'message' => 'Availability updated',
            'is_available' => $menuItem->is_available,
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = Category::where('is_active', true)
            ->withCount('menuItems')
            ->orderBy('sort_order')
            ->get();

        return response()->json($categories);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'sort_order' => 'integer|min:0',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        $category = Category::create($validated);

        return response()->json(['message' => 'Category created', 'data' => $category], 201);
    }

    public function updateCategory(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        $category->update($validated);

        return response()->json(['message' => 'Category updated', 'data' => $category->fresh()]);
    }
}