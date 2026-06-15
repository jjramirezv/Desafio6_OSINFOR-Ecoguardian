<?php

namespace App\Modules\LegalFootprint\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Congela snapshots verificables de la Huella Legal de un lote (S6-BE-02).
 *
 * Un snapshot toma la huella tecnica actual de un lote (via
 * LegalFootprintService), calcula un payload estable, le asigna un hash
 * reproducible (sha256 sobre JSON ordenado) y un codigo de verificacion publico
 * legible. Con eso se puede verificar despues, de forma compacta, el estado
 * tecnico que tenia el lote sin recalcular toda la huella.
 *
 * NO certifica legalidad ni declara ilegalidad: el snapshot solo resume
 * trazabilidad tecnica, consistencia documental, evidencia y alertas. No es
 * blockchain real: el hash es un sello de integridad local, no una prueba
 * distribuida.
 *
 * Usa DB::table en lugar de Eloquent para mantenerse alineado con el resto del
 * backend.
 */
class LegalFootprintSnapshotService
{
    public function __construct(
        private readonly LegalFootprintService $legalFootprintService,
    ) {
    }

    /**
     * Genera y persiste un snapshot de la huella legal de un lote.
     *
     * @return array<string,mixed> snapshot tal como queda en la tabla.
     *
     * @throws InvalidArgumentException si el lote no existe.
     */
    public function createFromImportBatch(int $importBatchId): array
    {
        $batch = DB::table('import_batches')->where('id', $importBatchId)->first();

        if ($batch === null) {
            throw new InvalidArgumentException("Import batch {$importBatchId} not found.");
        }

        $footprint = $this->legalFootprintService->buildFromImportBatch($importBatchId);

        $generatedAt = Carbon::now();
        $payload = $this->buildPayload($footprint, $generatedAt);

        $footprintHash = $this->hashPayload($payload);
        $verificationCode = $this->buildVerificationCode($importBatchId, $footprintHash);

        $status = (string) ($footprint['status'] ?? 'INCOMPLETE');
        $score = (int) ($footprint['completeness']['score'] ?? 0);

        $now = Carbon::now();
        $attributes = [
            'import_batch_id' => $importBatchId,
            'footprint_hash' => $footprintHash,
            'status' => $status,
            'score' => $score,
            'payload' => json_encode($payload),
            'metadata' => json_encode([
                'generated_by' => 'LegalFootprintSnapshotService',
                'hash_algorithm' => 'sha256',
            ]),
            'generated_at' => $generatedAt,
            'updated_at' => $now,
        ];

        // Reutiliza el snapshot existente cuando el mismo lote ya tiene un
        // snapshot con identico hash (la huella no cambio): mantiene el
        // verification_code estable y no rompe el unique.
        $existing = DB::table('legal_footprint_snapshots')
            ->where('import_batch_id', $importBatchId)
            ->where('footprint_hash', $footprintHash)
            ->first();

        if ($existing !== null) {
            DB::table('legal_footprint_snapshots')
                ->where('id', $existing->id)
                ->update($attributes);

            return $this->findById((int) $existing->id);
        }

        // Codigo libre: usa el legible; si ya estuviera tomado (otro hash),
        // anexa un sufijo de timestamp corto para no romper el unique.
        if (DB::table('legal_footprint_snapshots')->where('verification_code', $verificationCode)->exists()) {
            $verificationCode .= '-'.substr((string) $now->valueOf(), -5);
        }

        $attributes['verification_code'] = $verificationCode;
        $attributes['created_at'] = $now;

        $id = (int) DB::table('legal_footprint_snapshots')->insertGetId($attributes);

        return $this->findById($id);
    }

    /**
     * Busca un snapshot por su codigo de verificacion publico.
     *
     * @return array<string,mixed>|null
     */
    public function findByVerificationCode(string $verificationCode): ?array
    {
        $row = DB::table('legal_footprint_snapshots')
            ->where('verification_code', $verificationCode)
            ->first();

        return $row === null ? null : $this->mapSnapshot($row);
    }

    /**
     * Construye la respuesta publica compacta de un snapshot (para QR/API).
     *
     * @param  array<string,mixed>  $snapshot
     * @return array<string,mixed>
     */
    public function buildPublicPayload(array $snapshot): array
    {
        $payload = $snapshot['payload'] ?? [];

        $batch = $payload['import_batch'] ?? [];
        $counts = $payload['counts'] ?? [];
        $alerts = $payload['alerts'] ?? [];

        return [
            'verification_code' => $snapshot['verification_code'],
            'status' => $snapshot['status'],
            'score' => (int) $snapshot['score'],
            'footprint_hash' => $snapshot['footprint_hash'],
            'generated_at' => $snapshot['generated_at'],
            'summary' => [
                'batch_code' => $batch['batch_code'] ?? null,
                'import_type' => $batch['import_type'] ?? null,
                'source_records' => (int) ($counts['source_records'] ?? 0),
                'errors' => (int) ($counts['errors'] ?? 0),
                'alerts' => $alerts,
                'graph_nodes' => (int) ($counts['graph_nodes'] ?? 0),
                'graph_edges' => (int) ($counts['graph_edges'] ?? 0),
            ],
            'disclaimer' => 'Esta verificación no certifica legalidad; resume trazabilidad técnica, consistencia documental y alertas registradas.',
        ];
    }

    /**
     * Calcula el payload tecnico estable del snapshot a partir de la huella.
     *
     * @param  array<string,mixed>  $footprint
     * @return array<string,mixed>
     */
    private function buildPayload(array $footprint, Carbon $generatedAt): array
    {
        $batch = $footprint['import_batch'] ?? [];

        $operationalCount = 0;
        foreach (($footprint['operational_records'] ?? []) as $rows) {
            $operationalCount += count($rows);
        }

        $alerts = $footprint['alerts'] ?? [];

        return [
            'import_batch' => [
                'id' => $batch['id'] ?? null,
                'batch_code' => $batch['batch_code'] ?? null,
                'name' => $batch['name'] ?? null,
                'import_type' => $batch['import_type'] ?? null,
                'status' => $batch['status'] ?? null,
            ],
            'status' => $footprint['status'] ?? 'INCOMPLETE',
            'completeness' => $footprint['completeness'] ?? [],
            'alerts' => [
                'total' => (int) ($alerts['total'] ?? 0),
                'critical' => (int) ($alerts['critical'] ?? 0),
                'errors' => (int) ($alerts['errors'] ?? 0),
                'warnings' => (int) ($alerts['warnings'] ?? 0),
                'open' => (int) ($alerts['open'] ?? 0),
            ],
            'counts' => [
                'source_records' => count($footprint['source_records'] ?? []),
                'errors' => count($footprint['errors'] ?? []),
                'operational_records' => $operationalCount,
                'graph_nodes' => count($footprint['graph']['nodes'] ?? []),
                'graph_edges' => count($footprint['graph']['edges'] ?? []),
                'events' => count($footprint['events'] ?? []),
            ],
            'graph' => [
                'nodes' => count($footprint['graph']['nodes'] ?? []),
                'edges' => count($footprint['graph']['edges'] ?? []),
            ],
            'generated_at' => $generatedAt->toIso8601String(),
        ];
    }

    /**
     * Genera el hash sha256 sobre el JSON estable (claves ordenadas) del payload.
     *
     * Se excluye `generated_at` del calculo: el hash debe reflejar el estado
     * tecnico de la huella, no el instante de generacion. Asi dos snapshots de
     * un lote sin cambios producen el mismo hash y se reutiliza el codigo.
     *
     * @param  array<string,mixed>  $payload
     */
    private function hashPayload(array $payload): string
    {
        $hashable = $payload;
        unset($hashable['generated_at']);

        $stable = $this->sortKeysRecursive($hashable);
        $json = json_encode($stable, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return hash('sha256', (string) $json);
    }

    /**
     * Construye el codigo de verificacion legible: HLF-{batch}-{8 hex del hash}.
     */
    private function buildVerificationCode(int $importBatchId, string $footprintHash): string
    {
        return sprintf('HLF-%d-%s', $importBatchId, strtoupper(substr($footprintHash, 0, 8)));
    }

    /**
     * Ordena recursivamente las claves de arrays asociativos para estabilidad.
     */
    private function sortKeysRecursive(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        $value = array_map(fn ($item) => $this->sortKeysRecursive($item), $value);

        // Solo ordena claves de arrays asociativos; conserva el orden de listas.
        if (array_keys($value) !== range(0, count($value) - 1)) {
            ksort($value);
        }

        return $value;
    }

    /**
     * Carga un snapshot por id en forma de array mapeado.
     *
     * @return array<string,mixed>
     */
    private function findById(int $id): array
    {
        $row = DB::table('legal_footprint_snapshots')->where('id', $id)->first();

        return $this->mapSnapshot($row);
    }

    /**
     * Forma estandar de un snapshot para las respuestas y el payload publico.
     *
     * @return array<string,mixed>
     */
    private function mapSnapshot(object $row): array
    {
        return [
            'id' => (int) $row->id,
            'import_batch_id' => $row->import_batch_id === null ? null : (int) $row->import_batch_id,
            'verification_code' => $row->verification_code,
            'footprint_hash' => $row->footprint_hash,
            'status' => $row->status,
            'score' => (int) $row->score,
            'payload' => $this->decodeJson($row->payload),
            'metadata' => $this->decodeJson($row->metadata),
            'generated_at' => $row->generated_at,
            'created_at' => $row->created_at,
            'updated_at' => $row->updated_at,
        ];
    }

    /**
     * Decodifica un valor jsonb a array asociativo para uso interno.
     *
     * @return array<string,mixed>
     */
    private function decodeJson(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (! is_string($value) || $value === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }
}
