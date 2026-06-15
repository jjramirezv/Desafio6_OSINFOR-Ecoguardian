<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Tabla de alertas de consistencia del Sprint 5 (S5-BE-01).
     *
     * Cada fila es una observacion tecnica/documental detectada por el motor de
     * consistencia sobre un lote de importacion. NO declara legalidad: solo
     * marca inconsistencias para revision humana.
     */
    public function up(): void
    {
        Schema::create('consistency_alerts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('import_batch_id')
                ->nullable()
                ->constrained('import_batches')
                ->nullOnDelete();

            $table->foreignId('source_record_id')
                ->nullable()
                ->constrained('source_records')
                ->nullOnDelete();

            // Entidad operativa concreta a la que apunta la alerta (opcional).
            $table->string('entity_type')->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();

            $table->string('alert_code');
            // Ejemplos: DATA_QUALITY, TRACEABILITY, VOLUME, DOCUMENT, GRAPH.
            $table->string('alert_type');
            // Ejemplos: INFO, WARNING, ERROR, CRITICAL.
            $table->string('severity')->default('WARNING');
            $table->string('title');
            $table->text('description')->nullable();
            // Ejemplos: OPEN, REVIEWED, DISMISSED, RESOLVED.
            $table->string('status')->default('OPEN');
            $table->jsonb('evidence')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index('import_batch_id');
            $table->index('source_record_id');
            $table->index('alert_code');
            $table->index('alert_type');
            $table->index('severity');
            $table->index('status');
            $table->index(['entity_type', 'entity_id']);

            // Evita duplicar la misma alerta para la misma entidad de un lote.
            // Nombre corto explicito por el limite de identificadores de PostgreSQL.
            $table->unique(
                ['import_batch_id', 'entity_type', 'entity_id', 'alert_code'],
                'consistency_alerts_unique_alert'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consistency_alerts');
    }
};
