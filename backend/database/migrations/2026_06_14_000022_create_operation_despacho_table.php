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
        Schema::create('operation_despacho', function (Blueprint $table) {
            $table->id();

            $table->foreignId('import_batch_id')
                ->nullable()
                ->constrained('import_batches')
                ->nullOnDelete();

            $table->string('despacho_code')->nullable();
            $table->date('operation_date')->nullable();
            $table->string('dispatch_document')->nullable();
            $table->string('destination')->nullable();
            $table->string('species')->nullable();
            $table->decimal('total_volume_m3', 14, 3)->nullable();
            // Estados: RECORDED, OBSERVED, VOIDED.
            $table->string('status')->default('RECORDED');

            $table->foreignId('source_record_id')
                ->nullable()
                ->constrained('source_records')
                ->nullOnDelete();

            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index('import_batch_id');
            $table->index('despacho_code');
            $table->index('dispatch_document');
            $table->index('operation_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operation_despacho');
    }
};
