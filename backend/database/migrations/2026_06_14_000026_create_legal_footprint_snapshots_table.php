<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Tabla de snapshots de Huella Legal del Sprint 6 (S6-BE-01).
     *
     * Cada fila congela el estado tecnico de la huella de un lote en un momento
     * dado y le asigna un codigo de verificacion publico y un hash estable. NO
     * certifica legalidad ni declara ilegalidad: solo permite verificar de forma
     * reproducible la trazabilidad tecnica, la consistencia documental, la
     * evidencia y las alertas registradas para ese lote.
     */
    public function up(): void
    {
        Schema::create('legal_footprint_snapshots', function (Blueprint $table) {
            $table->id();

            $table->foreignId('import_batch_id')
                ->nullable()
                ->constrained('import_batches')
                ->nullOnDelete();

            // Codigo legible para verificacion publica, p.ej. HLF-1-ABC12345.
            $table->string('verification_code')->unique();
            // Hash sha256 sobre el payload ordenado/estable de la huella.
            $table->string('footprint_hash');
            // Estado tecnico congelado: TRACEABLE / OBSERVED / INCOMPLETE.
            $table->string('status');
            $table->integer('score')->default(0);
            // Payload tecnico completo del snapshot.
            $table->jsonb('payload');
            $table->jsonb('metadata')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();

            $table->index('import_batch_id');
            $table->index('footprint_hash');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legal_footprint_snapshots');
    }
};
