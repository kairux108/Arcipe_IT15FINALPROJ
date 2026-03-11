<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\InventoryLog;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Users
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@canteen.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        $cashier = User::create([
            'name' => 'Cashier User',
            'email' => 'cashier@canteen.com',
            'password' => Hash::make('password'),
            'role' => 'cashier',
        ]);

        $customer = User::create([
            'name' => 'John Doe',
            'email' => 'customer@canteen.com',
            'password' => Hash::make('password'),
            'role' => 'customer',
        ]);

        // Categories
        $categoryData = [
            ['name' => 'Meals', 'slug' => 'meals', 'icon' => '🍱', 'sort_order' => 1],
            ['name' => 'Snacks', 'slug' => 'snacks', 'icon' => '🍟', 'sort_order' => 2],
            ['name' => 'Beverages', 'slug' => 'beverages', 'icon' => '🥤', 'sort_order' => 3],
            ['name' => 'Desserts', 'slug' => 'desserts', 'icon' => '🍰', 'sort_order' => 4],
            ['name' => 'Combos', 'slug' => 'combos', 'icon' => '🍽️', 'sort_order' => 5],
        ];

        foreach ($categoryData as $cat) {
            Category::create($cat + ['description' => "All {$cat['name']} items"]);
        }

        $meals = Category::where('slug', 'meals')->first();
        $snacks = Category::where('slug', 'snacks')->first();
        $beverages = Category::where('slug', 'beverages')->first();
        $desserts = Category::where('slug', 'desserts')->first();
        $combos = Category::where('slug', 'combos')->first();

        // Menu Items (30+)
        $menuItems = [
            // Meals
            ['category_id' => $meals->id, 'name' => 'Chicken Adobo with Rice', 'price' => 85.00, 'stock_quantity' => 50],
            ['category_id' => $meals->id, 'name' => 'Pork Sinigang', 'price' => 90.00, 'stock_quantity' => 40],
            ['category_id' => $meals->id, 'name' => 'Beef Caldereta', 'price' => 95.00, 'stock_quantity' => 35],
            ['category_id' => $meals->id, 'name' => 'Fried Chicken with Rice', 'price' => 80.00, 'stock_quantity' => 60],
            ['category_id' => $meals->id, 'name' => 'Pork Chop with Mashed Potato', 'price' => 95.00, 'stock_quantity' => 30],
            ['category_id' => $meals->id, 'name' => 'Grilled Bangus', 'price' => 85.00, 'stock_quantity' => 25],
            ['category_id' => $meals->id, 'name' => 'Pancit Canton', 'price' => 75.00, 'stock_quantity' => 45],
            ['category_id' => $meals->id, 'name' => 'Fried Rice with Egg', 'price' => 55.00, 'stock_quantity' => 80],
            ['category_id' => $meals->id, 'name' => 'Veggie Stir Fry', 'price' => 65.00, 'stock_quantity' => 40],
            ['category_id' => $meals->id, 'name' => 'Chicken Tinola', 'price' => 80.00, 'stock_quantity' => 30],

            // Snacks
            ['category_id' => $snacks->id, 'name' => 'Hotdog Sandwich', 'price' => 35.00, 'stock_quantity' => 100],
            ['category_id' => $snacks->id, 'name' => 'Cheese Burger', 'price' => 55.00, 'stock_quantity' => 60],
            ['category_id' => $snacks->id, 'name' => 'French Fries', 'price' => 45.00, 'stock_quantity' => 80],
            ['category_id' => $snacks->id, 'name' => 'Clubhouse Sandwich', 'price' => 65.00, 'stock_quantity' => 50],
            ['category_id' => $snacks->id, 'name' => 'Nachos with Cheese', 'price' => 50.00, 'stock_quantity' => 40],
            ['category_id' => $snacks->id, 'name' => 'Fishball Sticks (6pcs)', 'price' => 25.00, 'stock_quantity' => 150],
            ['category_id' => $snacks->id, 'name' => 'Kwek-Kwek (4pcs)', 'price' => 20.00, 'stock_quantity' => 120],

            // Beverages
            ['category_id' => $beverages->id, 'name' => 'Bottled Water', 'price' => 20.00, 'stock_quantity' => 200],
            ['category_id' => $beverages->id, 'name' => 'Canned Soda', 'price' => 35.00, 'stock_quantity' => 150],
            ['category_id' => $beverages->id, 'name' => 'Fresh Fruit Juice', 'price' => 45.00, 'stock_quantity' => 80],
            ['category_id' => $beverages->id, 'name' => 'Milk Tea (Regular)', 'price' => 65.00, 'stock_quantity' => 60],
            ['category_id' => $beverages->id, 'name' => 'Milk Tea (Large)', 'price' => 80.00, 'stock_quantity' => 50],
            ['category_id' => $beverages->id, 'name' => 'Hot Coffee', 'price' => 40.00, 'stock_quantity' => 100],
            ['category_id' => $beverages->id, 'name' => 'Iced Coffee', 'price' => 55.00, 'stock_quantity' => 80],
            ['category_id' => $beverages->id, 'name' => 'Sports Drink', 'price' => 45.00, 'stock_quantity' => 90],

            // Desserts
            ['category_id' => $desserts->id, 'name' => 'Halo-Halo', 'price' => 75.00, 'stock_quantity' => 40],
            ['category_id' => $desserts->id, 'name' => 'Leche Flan', 'price' => 45.00, 'stock_quantity' => 30],
            ['category_id' => $desserts->id, 'name' => 'Buko Pandan', 'price' => 35.00, 'stock_quantity' => 50],
            ['category_id' => $desserts->id, 'name' => 'Mango Graham', 'price' => 55.00, 'stock_quantity' => 35],
            ['category_id' => $desserts->id, 'name' => 'Mais con Yelo', 'price' => 40.00, 'stock_quantity' => 45],

            // Combos
            ['category_id' => $combos->id, 'name' => 'Meal + Drink Combo', 'price' => 110.00, 'stock_quantity' => 50],
            ['category_id' => $combos->id, 'name' => 'Snack + Drink Combo', 'price' => 75.00, 'stock_quantity' => 60],
            ['category_id' => $combos->id, 'name' => 'Family Combo (3 meals)', 'price' => 250.00, 'stock_quantity' => 20],
        ];

        foreach ($menuItems as $item) {
            MenuItem::create([
                'category_id' => $item['category_id'],
                'name' => $item['name'],
                'slug' => Str::slug($item['name']) . '-' . Str::random(5),
                'description' => "Delicious {$item['name']} freshly prepared.",
                'price' => $item['price'],
                'is_available' => true,
                'stock_quantity' => $item['stock_quantity'],
                'low_stock_threshold' => 10,
                'preparation_time' => rand(3, 15),
            ]);
        }

        // Seed 200+ orders
        $allMenuItems = MenuItem::all();
        $statuses = ['completed', 'completed', 'completed', 'completed', 'completed', 'cancelled', 'pending', 'preparing'];
        $paymentMethods = ['cash', 'cash', 'cash', 'card', 'digital_wallet'];

        for ($i = 1; $i <= 220; $i++) {
            $createdAt = now()->subDays(rand(0, 60))->subHours(rand(0, 23));
            $status = $statuses[array_rand($statuses)];
            $orderItems = $allMenuItems->random(rand(1, 4));

            $subtotal = 0;
            $orderItemsData = [];

            foreach ($orderItems as $menuItem) {
                $quantity = rand(1, 3);
                $itemSubtotal = $menuItem->price * $quantity;
                $subtotal += $itemSubtotal;
                $orderItemsData[] = [
                    'menu_item_id' => $menuItem->id,
                    'item_name' => $menuItem->name,
                    'unit_price' => $menuItem->price,
                    'quantity' => $quantity,
                    'subtotal' => $itemSubtotal,
                ];
            }

            $tax = $subtotal * 0.12;
            $total = $subtotal + $tax;

            $order = Order::create([
                'order_number' => 'ORD' . $createdAt->format('Ymd') . str_pad($i, 4, '0', STR_PAD_LEFT),
                'user_id' => $customer->id,
                'cashier_id' => $cashier->id,
                'status' => $status,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
                'amount_paid' => $total + rand(0, 50),
                'change_given' => rand(0, 50),
                'payment_method' => $paymentMethods[array_rand($paymentMethods)],
                'completed_at' => $status === 'completed' ? $createdAt->addMinutes(rand(5, 30)) : null,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            foreach ($orderItemsData as $itemData) {
                OrderItem::create(['order_id' => $order->id] + $itemData);
            }
        }
    }
}