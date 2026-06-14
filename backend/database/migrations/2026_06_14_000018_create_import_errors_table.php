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
        Schema::create('import_errors', function (Blueprint $table) {
            $table->id();

            $table->foreignId('import_batch_id')
                ->constrained('import_batches')
                ->cascadeOnDelete();

            $table->unsignedInteger('row_number')->nullable();
            $table->string('field_name')->nullable();
            $table->string('error_code');
            $table->text('error_message');
            $table->text('raw_value')->nullable();
            // Severidades: WARNING, ERROR, CRITICAL.
            $table->string('severity')->default('ERROR');
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index('import_batch_id');
            $table->index('error_code');
            $table->index('severity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('import_errors');
    }
};
