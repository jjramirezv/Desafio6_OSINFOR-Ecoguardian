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
        Schema::create('documents', function (Blueprint $table) {
            $table->id();

            $table->foreignId('source_system_id')
                ->nullable()
                ->constrained('source_systems')
                ->nullOnDelete();

            // Tipo de documento: CENSO_EXCEL, LIBRO_TALA_EXCEL,
            // LIBRO_TROZADO_EXCEL, LIBRO_DESPACHO_EXCEL, BALANCE_PDF,
            // GTF_DOCUMENT, ALERTA_OSINFOR.
            $table->string('document_type');
            $table->string('name');
            $table->string('file_path')->nullable();
            $table->string('mime_type')->nullable();
            $table->string('status');
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index('source_system_id');
            $table->index('document_type');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
