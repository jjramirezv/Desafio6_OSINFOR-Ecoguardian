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
        Schema::create('import_batches', function (Blueprint $table) {
            $table->id();

            $table->foreignId('organization_id')
                ->nullable()
                ->constrained('organizations')
                ->nullOnDelete();

            $table->foreignId('source_system_id')
                ->nullable()
                ->constrained('source_systems')
                ->nullOnDelete();

            $table->string('batch_code')->unique();
            $table->string('name');
            // Ejemplos: CENSO_FORESTAL, LIBRO_OPERACIONES, BALANCE_EXTRACCION,
            // GTF, CTP.
            $table->string('import_type');
            $table->string('source_file_name')->nullable();
            $table->string('source_file_path')->nullable();
            // Estados: PENDING, PROCESSING, COMPLETED, COMPLETED_WITH_ERRORS,
            // FAILED.
            $table->string('status')->default('PENDING');
            $table->unsignedInteger('total_rows')->default(0);
            $table->unsignedInteger('processed_rows')->default(0);
            $table->unsignedInteger('successful_rows')->default(0);
            $table->unsignedInteger('failed_rows')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index('organization_id');
            $table->index('source_system_id');
            $table->index('import_type');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('import_batches');
    }
};
