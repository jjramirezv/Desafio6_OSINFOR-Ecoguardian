<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cutting_parcels', function (Blueprint $table) {
            $table->id();

            $table->foreignId('operational_plan_id')
                ->constrained('operational_plans')
                ->cascadeOnDelete();

            $table->string('code');
            $table->string('name')->nullable();
            $table->integer('authorized_trees_count')->nullable();
            $table->decimal('authorized_volume', 14, 3)->nullable();
            $table->string('status');
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique(['operational_plan_id', 'code']);

            $table->index('operational_plan_id');
            $table->index('code');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cutting_parcels');
    }
};
