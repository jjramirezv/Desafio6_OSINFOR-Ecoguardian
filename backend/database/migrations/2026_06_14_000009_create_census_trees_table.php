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
        Schema::create('census_trees', function (Blueprint $table) {
            $table->id();

            $table->foreignId('cutting_parcel_id')
                ->constrained('cutting_parcels')
                ->cascadeOnDelete();

            $table->string('tree_code');
            $table->string('species')->nullable();
            $table->string('scientific_name')->nullable();
            $table->decimal('authorized_volume', 14, 3)->nullable();
            $table->decimal('diameter', 10, 2)->nullable();
            $table->decimal('height', 10, 2)->nullable();
            // Estados: DISPONIBLE, TALADO, TROZADO, DESPACHADO, OBSERVADO,
            // DESCARTADO, SIN_TRAZABILIDAD.
            $table->string('status');
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique(['cutting_parcel_id', 'tree_code']);

            $table->index('cutting_parcel_id');
            $table->index('tree_code');
            $table->index('species');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('census_trees');
    }
};
