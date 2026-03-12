<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class MenuController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MenuItem::with('category');

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('available')) {
            $query->where('is_available', true)->where('stock_quantity', '>', 0);
        }

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $items = $query->orderBy('name')->paginate($request->get('per_page', 200));

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
            'is_available'        => 'nullable',
            'image'               => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // Handle image upload
        $imageUrl = null;
        if ($request->hasFile('image')) {
            $path     = $request->file('image')->store('menu-images', 'public');
            $imageUrl = '/storage/' . $path;
        }

        $item = MenuItem::create([
            'name'                => $validated['name'],
            'slug'                => Str::slug($validated['name']) . '-' . time(),
            'category_id'         => $validated['category_id'],
            'description'         => $validated['description'] ?? null,
            'price'               => $validated['price'],
            'stock_quantity'      => $validated['stock_quantity'] ?? 0,
            'low_stock_threshold' => $validated['low_stock_threshold'] ?? 10,
            'preparation_time'    => $validated['preparation_time'] ?? 5,
            'is_available'        => filter_var($request->input('is_available', true), FILTER_VALIDATE_BOOLEAN),
            'image_url'           => $imageUrl,
        ]);

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
            'is_available'        => 'nullable',
            'image'               => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'remove_image'        => 'nullable',
        ]);

        $data = collect($validated)->except(['image', 'remove_image'])->toArray();

        // Handle is_available as string from FormData
        if ($request->has('is_available')) {
            $data['is_available'] = filter_var($request->input('is_available'), FILTER_VALIDATE_BOOLEAN);
        }

        // Regenerate slug if name changed
        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']) . '-' . time();
        }

        // Remove image
        if ($request->input('remove_image') == '1' && $menuItem->image_url) {
            $oldPath = str_replace('/storage/', '', $menuItem->image_url);
            Storage::disk('public')->delete($oldPath);
            $data['image_url'] = null;
        }

        // New image upload
        if ($request->hasFile('image')) {
            // Delete old image
            if ($menuItem->image_url) {
                $oldPath = str_replace('/storage/', '', $menuItem->image_url);
                Storage::disk('public')->delete($oldPath);
            }
            $path             = $request->file('image')->store('menu-images', 'public');
            $data['image_url'] = '/storage/' . $path;
        }

        $menuItem->update($data);

        return response()->json([
            'message' => 'Menu item updated successfully',
            'data'    => $menuItem->fresh()->load('category'),
        ]);
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        // Clean up image file
        if ($menuItem->image_url) {
            $path = str_replace('/storage/', '', $menuItem->image_url);
            Storage::disk('public')->delete($path);
        }

        $menuItem->delete();

        return response()->json(['message' => 'Menu item deleted successfully']);
    }

    public function toggleAvailability(MenuItem $menuItem): JsonResponse
    {
        $menuItem->update(['is_available' => !$menuItem->is_available]);

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