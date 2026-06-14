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
        Schema::create('trace_events', function (Blueprint $table) {
            $table->id();

            $table->string('event_type');
            $table->string('entity_type')->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();

            $table->foreignId('source_system_id')
                ->nullable()
                ->constrained('source_systems')
                ->nullOnDelete();

            $table->jsonb('payload')->nullable();
            $table->timestamps();

            $table->index('event_type');
            $table->index('entity_type');
            $table->index('entity_id');
            $table->index('source_system_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trace_events');
    }
};
