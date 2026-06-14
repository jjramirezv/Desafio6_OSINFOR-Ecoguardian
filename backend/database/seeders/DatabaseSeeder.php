<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // S1-BE-07: caso demo base y primer grafo de evidencia.
        $this->call([
            DemoCcnnBelgicaSeeder::class,
        ]);
    }
}
