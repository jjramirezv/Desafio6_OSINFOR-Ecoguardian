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
        Schema::create('source_systems', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code');
            // Tipo de fuente: SIGOsfc, ALERTAS_OSINFOR, CENSO_FORESTAL,
            // LIBRO_OPERACIONES, BALANCE_EXTRACCION, GTF, CTP, etc.
            $table->string('type');
            $table->text('description')->nullable();
            // Modo de integracion: MANUAL_UPLOAD, API_FUTURE, SIMULATED,
            // SYSTEM_REFERENCE.
            $table->string('integration_type');
            $table->string('status');
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique('code');

            $table->index('type');
            $table->index('integration_type');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('source_systems');
    }
};
