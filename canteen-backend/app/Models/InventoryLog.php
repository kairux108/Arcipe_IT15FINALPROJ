<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryLog extends Model
{
    protected $fillable = [
        'menu_item_id',
        'user_id',
        'type',           // restock, deduction, adjustment, waste
        'quantity_before', 
        'quantity_change', 
        'quantity_after',  
        'reason',
        'order_id'
    ];

    public function menuItem() { return $this->belongsTo(MenuItem::class); }
    public function user() { return $this->belongsTo(User::class); }
}