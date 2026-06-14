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
        Schema::create('operational_plans', function (Blueprint $table) {
            $table->id();

            $table->foreignId('forest_title_id')
                ->constrained('forest_titles')
                ->cascadeOnDelete();

            $table->string('code');
            $table->string('name');
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->string('status');
            $table->decimal('approved_volume', 14, 3)->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique(['forest_title_id', 'code']);

            $table->index('forest_title_id');
            $table->index('code');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operational_plans');
    }
};
