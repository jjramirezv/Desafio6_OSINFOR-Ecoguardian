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
        Schema::create('forest_titles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('organization_id')
                ->nullable()
                ->constrained('organizations')
                ->nullOnDelete();

            $table->string('code');
            $table->string('name');
            $table->string('holder_name')->nullable();
            $table->string('title_type')->nullable();
            $table->string('status');
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique('code');

            $table->index('organization_id');
            $table->index('code');
            $table->index('status');
            $table->index('title_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('forest_titles');
    }
};
