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
        Schema::create('trace_nodes', function (Blueprint $table) {
            $table->id();

            // Tipo de nodo: ENTIDAD, TITULO_HABILITANTE, PLAN_OPERATIVO,
            // PARCELA, ARBOL, DOCUMENTO, EVENTO, LOTE, ALERTA, HASH, GTF,
            // BALANCE, CTP, COMPRADOR, PUESTO_CONTROL.
            $table->string('node_type');
            $table->string('label');
            // Referencia polimorfica opcional a la entidad de dominio que
            // respalda el nodo (tabla + id).
            $table->string('entity_table')->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('status');
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index('node_type');
            $table->index('status');
            $table->index('entity_table');
            $table->index('entity_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trace_nodes');
    }
};
