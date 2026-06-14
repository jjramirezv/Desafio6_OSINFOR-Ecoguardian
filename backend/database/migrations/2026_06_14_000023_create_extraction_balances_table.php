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
        Schema::create('extraction_balances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('forest_title_id')
                ->nullable()
                ->constrained('forest_titles')
                ->nullOnDelete();

            $table->foreignId('operational_plan_id')
                ->nullable()
                ->constrained('operational_plans')
                ->nullOnDelete();

            $table->foreignId('cutting_parcel_id')
                ->nullable()
                ->constrained('cutting_parcels')
                ->nullOnDelete();

            $table->foreignId('import_batch_id')
                ->nullable()
                ->constrained('import_batches')
                ->nullOnDelete();

            $table->foreignId('source_record_id')
                ->nullable()
                ->constrained('source_records')
                ->nullOnDelete();

            $table->string('balance_code')->nullable();
            $table->string('species')->nullable();
            $table->decimal('authorized_volume_m3', 14, 3)->nullable();
            $table->decimal('extracted_volume_m3', 14, 3)->nullable();
            $table->decimal('remaining_volume_m3', 14, 3)->nullable();
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            // Estados: ACTIVE, OBSERVED, CLOSED, VOIDED.
            $table->string('status')->default('ACTIVE');
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index('forest_title_id');
            $table->index('operational_plan_id');
            $table->index('cutting_parcel_id');
            $table->index('import_batch_id');
            $table->index('balance_code');
            $table->index('species');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('extraction_balances');
    }
};
