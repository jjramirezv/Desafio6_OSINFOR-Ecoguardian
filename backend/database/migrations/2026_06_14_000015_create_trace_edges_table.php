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
        Schema::create('trace_edges', function (Blueprint $table) {
            $table->id();

            $table->foreignId('source_node_id')
                ->constrained('trace_nodes')
                ->cascadeOnDelete();

            $table->foreignId('target_node_id')
                ->constrained('trace_nodes')
                ->cascadeOnDelete();

            // Tipo de relacion: POSEE, AMPARA, AUTORIZA, CONTIENE, ORIGINA,
            // REGISTRA, MOVILIZA_CON, CONTRASTA_CON, TRANSFORMA_EN,
            // GENERA_ALERTA, TIENE_DISCREPANCIA, SELLADO_POR, VERIFICADO_POR,
            // CONSULTADO_POR.
            $table->string('relation_type');
            $table->string('status');
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index('source_node_id');
            $table->index('target_node_id');
            $table->index('relation_type');
            $table->index('status');

            $table->unique(['source_node_id', 'target_node_id', 'relation_type'], 'trace_edges_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trace_edges');
    }
};
