<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // Drop the existing cascade foreign key
            $table->dropForeign(['menu_item_id']);

            // Make the column nullable
            $table->unsignedBigInteger('menu_item_id')->nullable()->change();

            // Re-add foreign key with set null instead of cascade
            $table->foreign('menu_item_id')
                  ->references('id')
                  ->on('menu_items')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // Revert back to cascade (rollback)
            $table->dropForeign(['menu_item_id']);
            $table->unsignedBigInteger('menu_item_id')->nullable(false)->change();
            $table->foreign('menu_item_id')
                  ->references('id')
                  ->on('menu_items')
                  ->onDelete('cascade');
        });
    }
};