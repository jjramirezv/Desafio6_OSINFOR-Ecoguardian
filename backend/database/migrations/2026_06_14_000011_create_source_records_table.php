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
        Schema::create('source_records', function (Blueprint $table) {
            $table->id();

            $table->foreignId('source_system_id')
                ->constrained('source_systems')
                ->cascadeOnDelete();

            $table->string('external_id')->nullable();
            $table->string('record_type');
            $table->timestamp('record_date')->nullable();
            $table->jsonb('raw_payload')->nullable();
            $table->jsonb('normalized_payload')->nullable();
            $table->string('status');
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index('source_system_id');
            $table->index('external_id');
            $table->index('record_type');
            $table->index('status');
            $table->index('record_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('source_records');
    }
};
