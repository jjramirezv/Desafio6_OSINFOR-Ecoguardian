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
        Schema::create('document_hashes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('document_id')
                ->constrained('documents')
                ->cascadeOnDelete();

            $table->string('hash_algorithm');
            $table->string('hash_value');
            $table->timestamp('created_at')->useCurrent();

            $table->index('document_id');
            $table->index('hash_algorithm');
            $table->index('hash_value');

            $table->unique(['document_id', 'hash_algorithm', 'hash_value'], 'document_hashes_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_hashes');
    }
};
