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
        Schema::create('operation_trozado', function (Blueprint $table) {
            $table->id();

            $table->foreignId('operation_tala_id')
                ->nullable()
                ->constrained('operation_tala')
                ->nullOnDelete();

            $table->foreignId('import_batch_id')
                ->nullable()
                ->constrained('import_batches')
                ->nullOnDelete();

            $table->string('trozado_code')->nullable();
            $table->date('operation_date')->nullable();
            $table->string('piece_code');
            $table->string('tree_code')->nullable();
            $table->string('species')->nullable();
            $table->decimal('length_m', 10, 2)->nullable();
            $table->decimal('diameter_cm', 10, 2)->nullable();
            $table->decimal('volume_m3', 14, 3)->nullable();
            // Estados: RECORDED, OBSERVED, VOIDED.
            $table->string('status')->default('RECORDED');

            $table->foreignId('source_record_id')
                ->nullable()
                ->constrained('source_records')
                ->nullOnDelete();

            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index('operation_tala_id');
            $table->index('import_batch_id');
            $table->index('piece_code');
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
        Schema::dropIfExists('operation_trozado');
    }
};
