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
        Schema::create('operation_tala', function (Blueprint $table) {
            $table->id();

            $table->foreignId('census_tree_id')
                ->nullable()
                ->constrained('census_trees')
                ->nullOnDelete();

            $table->foreignId('import_batch_id')
                ->nullable()
                ->constrained('import_batches')
                ->nullOnDelete();

            $table->string('tala_code')->nullable();
            $table->date('operation_date')->nullable();
            $table->string('tree_code');
            $table->string('species')->nullable();
            $table->decimal('volume_m3', 14, 3)->nullable();
            $table->string('operator_name')->nullable();
            // Estados: RECORDED, OBSERVED, VOIDED.
            $table->string('status')->default('RECORDED');

            $table->foreignId('source_record_id')
                ->nullable()
                ->constrained('source_records')
                ->nullOnDelete();

            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index('census_tree_id');
            $table->index('import_batch_id');
            $table->index('tree_code');
            $table->index('operation_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operation_tala');
    }
};
