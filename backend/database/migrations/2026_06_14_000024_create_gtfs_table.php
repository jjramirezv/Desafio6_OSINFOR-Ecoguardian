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
        Schema::create('gtfs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('import_batch_id')
                ->nullable()
                ->constrained('import_batches')
                ->nullOnDelete();

            $table->foreignId('source_record_id')
                ->nullable()
                ->constrained('source_records')
                ->nullOnDelete();

            $table->foreignId('operation_despacho_id')
                ->nullable()
                ->constrained('operation_despacho')
                ->nullOnDelete();

            $table->foreignId('extraction_balance_id')
                ->nullable()
                ->constrained('extraction_balances')
                ->nullOnDelete();

            $table->string('gtf_number')->unique();
            $table->date('issue_date')->nullable();
            $table->string('origin')->nullable();
            $table->string('destination')->nullable();
            $table->string('transporter_name')->nullable();
            $table->string('vehicle_plate')->nullable();
            $table->string('species')->nullable();
            $table->decimal('volume_m3', 14, 3)->nullable();
            // Estados: RECORDED, OBSERVED, VOIDED.
            $table->string('status')->default('RECORDED');
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index('import_batch_id');
            $table->index('source_record_id');
            $table->index('operation_despacho_id');
            $table->index('extraction_balance_id');
            $table->index('gtf_number');
            $table->index('issue_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gtfs');
    }
};
