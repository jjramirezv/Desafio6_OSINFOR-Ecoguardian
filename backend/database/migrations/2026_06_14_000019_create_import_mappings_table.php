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
        Schema::create('import_mappings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('source_system_id')
                ->nullable()
                ->constrained('source_systems')
                ->nullOnDelete();

            $table->string('import_type');
            $table->string('source_field');
            $table->string('target_table');
            $table->string('target_field');
            // Tipos: string, integer, decimal, date, json.
            $table->string('data_type')->nullable();
            $table->boolean('is_required')->default(false);
            $table->string('transform_rule')->nullable();
            $table->string('default_value')->nullable();
            $table->string('status')->default('ACTIVE');
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique([
                'source_system_id',
                'import_type',
                'source_field',
                'target_table',
                'target_field',
            ], 'import_mappings_unique_mapping');

            $table->index('source_system_id');
            $table->index('import_type');
            $table->index('target_table');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('import_mappings');
    }
};
