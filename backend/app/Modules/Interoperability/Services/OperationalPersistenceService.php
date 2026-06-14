<?php

namespace App\Modules\Interoperability\Services;

use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

/**
 * Persiste source_records normalizados en las tablas operativas (S2-BE-10).
 *
 * Toma los source_records de un import_batch (resueltos por
 * metadata->import_batch_id) que estan en estado NORMALIZED y, segun su
 * record_type, crea el registro operativo correspondiente:
 *
 *   LIBRO_OPERACIONES_TALA     -> operation_tala
 *   LIBRO_OPERACIONES_TROZADO  -> operation_trozado
 *   LIBRO_OPERACIONES_DESPACHO -> operation_despacho
 *   BALANCE_EXTRACCION         -> extraction_balances
 *   GTF                        -> gtfs
 *
 * CENSO_FORESTAL no se persiste (pertenece al censo base del plan/parcela) y se
 * marca como SKIPPED. La operacion es idempotente: si ya existe un registro
 * operativo para el source_record no se duplica y se cuenta como
 * already_persisted.
 *
 * Usa DB::table en lugar de Eloquent para mantenerse alineado con el resto del
 * conector interoperable.
 */
class OperationalPersistenceService
{
    /**
     * Mapeo de record_type a la tabla operativa destino.
     */
    private const OPERATIONAL_TABLES = [
        'LIBRO_OPERACIONES_TALA' => 'operation_tala',
        'LIBRO_OPERACIONES_TROZADO' => 'operation_trozado',
        'LIBRO_OPERACIONES_DESPACHO' => 'operation_despacho',
        'BALANCE_EXTRACCION' => 'extraction_balances',
        'GTF' => 'gtfs',
    ];

    /**
     * Persiste los source_records normalizados de un lote en tablas operativas.
     *
     * @return array{import_batch_id:int,processed:int,persisted:int,already_persisted:int,skipped:int,errors:int}
     *
     * @throws InvalidArgumentException si el lote no existe.
     */
    public function persistImportBatch(int $importBatchId): array
    {
        $batch = DB::table('import_batches')->where('id', $importBatchId)->first();

        if ($batch === null) {
            throw new InvalidArgumentException("Import batch {$importBatchId} not found.");
        }

        // Resolver source_records del lote por metadata->import_batch_id. Solo se
        // procesan los que ya estan normalizados.
        $records = DB::table('source_records')
            ->whereRaw("metadata->>'import_batch_id' = ?", [(string) $importBatchId])
            ->where('status', 'NORMALIZED')
            ->orderBy('id')
            ->get();

        $processed = 0;
        $persisted = 0;
        $alreadyPersisted = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($records as $record) {
            $processed++;

            try {
                $outcome = DB::transaction(
                    fn () => $this->persistRecord($importBatchId, $record)
                );

                match ($outcome) {
                    'persisted' => $persisted++,
                    'already_persisted' => $alreadyPersisted++,
                    'skipped' => $skipped++,
                    default => null,
                };
            } catch (Throwable $e) {
                $errors++;
            }
        }

        return [
            'import_batch_id' => $importBatchId,
            'processed' => $processed,
            'persisted' => $persisted,
            'already_persisted' => $alreadyPersisted,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    /**
     * Persiste un unico source_record en su tabla operativa.
     *
     * @return string Uno de: persisted, already_persisted, skipped.
     *
     * @throws RuntimeException ante una violacion controlada (p. ej. GTF unico
     *                          ya tomado por otro source_record).
     */
    private function persistRecord(int $importBatchId, object $record): string
    {
        $recordType = strtoupper(trim((string) $record->record_type));

        // CENSO_FORESTAL no se persiste aqui: pertenece al censo base.
        if ($recordType === 'CENSO_FORESTAL') {
            $this->updateSourceRecordStatus((int) $record->id, 'SKIPPED');

            return 'skipped';
        }

        $table = self::OPERATIONAL_TABLES[$recordType] ?? null;

        // Tipo no soportado por la persistencia operativa: se omite.
        if ($table === null) {
            $this->updateSourceRecordStatus((int) $record->id, 'SKIPPED');

            return 'skipped';
        }

        // Idempotencia: si ya existe el registro operativo para este
        // source_record, no duplicar.
        $alreadyExists = DB::table($table)
            ->where('source_record_id', $record->id)
            ->exists();

        if ($alreadyExists) {
            $this->updateSourceRecordStatus((int) $record->id, 'PERSISTED');

            return 'already_persisted';
        }

        $payload = $this->decodePayload($record->normalized_payload);

        $metadata = [
            'source_record_id' => (int) $record->id,
            'import_batch_id' => $importBatchId,
            'persisted_from' => 'source_records',
        ];

        $row = $this->buildOperationalRow($recordType, $payload, $importBatchId, (int) $record->id, $metadata);

        $this->insertOperationalRow($table, $recordType, $payload, $row, (int) $record->id);

        $this->updateSourceRecordStatus((int) $record->id, 'PERSISTED');

        return 'persisted';
    }

    /**
     * Construye la fila operativa segun el tipo.
     *
     * @param  array<string,mixed>  $payload
     * @param  array<string,mixed>  $metadata
     * @return array<string,mixed>
     */
    private function buildOperationalRow(
        string $recordType,
        array $payload,
        int $importBatchId,
        int $sourceRecordId,
        array $metadata
    ): array {
        $now = now();

        $base = [
            'import_batch_id' => $importBatchId,
            'source_record_id' => $sourceRecordId,
            'metadata' => json_encode($metadata),
            'created_at' => $now,
            'updated_at' => $now,
        ];

        return match ($recordType) {
            'LIBRO_OPERACIONES_TALA' => $base + [
                'tree_code' => $payload['tree_code'] ?? null,
                'species' => $payload['species'] ?? null,
                'volume_m3' => $payload['volume_m3'] ?? null,
                'operation_date' => $payload['operation_date'] ?? null,
                'operator_name' => $payload['operator_name'] ?? null,
                'status' => 'RECORDED',
            ],
            'LIBRO_OPERACIONES_TROZADO' => $base + [
                'piece_code' => $payload['piece_code'] ?? null,
                'tree_code' => $payload['tree_code'] ?? null,
                'species' => $payload['species'] ?? null,
                'length_m' => $payload['length_m'] ?? null,
                'diameter_cm' => $payload['diameter_cm'] ?? null,
                'volume_m3' => $payload['volume_m3'] ?? null,
                'operation_date' => $payload['operation_date'] ?? null,
                'status' => 'RECORDED',
            ],
            'LIBRO_OPERACIONES_DESPACHO' => $base + [
                'despacho_code' => $payload['despacho_code'] ?? null,
                'dispatch_document' => $payload['dispatch_document'] ?? null,
                'destination' => $payload['destination'] ?? null,
                'species' => $payload['species'] ?? null,
                'total_volume_m3' => $payload['total_volume_m3'] ?? null,
                'operation_date' => $payload['operation_date'] ?? null,
                'status' => 'RECORDED',
            ],
            'BALANCE_EXTRACCION' => $base + [
                'balance_code' => $payload['balance_code'] ?? null,
                'species' => $payload['species'] ?? null,
                'authorized_volume_m3' => $payload['authorized_volume_m3'] ?? null,
                'extracted_volume_m3' => $payload['extracted_volume_m3'] ?? null,
                'remaining_volume_m3' => $payload['remaining_volume_m3'] ?? null,
                'period_start' => $payload['period_start'] ?? null,
                'period_end' => $payload['period_end'] ?? null,
                'status' => 'ACTIVE',
            ],
            'GTF' => $base + [
                'gtf_number' => $payload['gtf_number'] ?? null,
                'issue_date' => $payload['issue_date'] ?? null,
                'origin' => $payload['origin'] ?? null,
                'destination' => $payload['destination'] ?? null,
                'transporter_name' => $payload['transporter_name'] ?? null,
                'vehicle_plate' => $payload['vehicle_plate'] ?? null,
                'species' => $payload['species'] ?? null,
                'volume_m3' => $payload['volume_m3'] ?? null,
                'status' => 'RECORDED',
            ],
            default => $base,
        };
    }

    /**
     * Inserta la fila operativa, con guardas controladas para GTF (unico).
     *
     * @param  array<string,mixed>  $payload
     * @param  array<string,mixed>  $row
     *
     * @throws RuntimeException si gtf_number ya pertenece a otro source_record.
     */
    private function insertOperationalRow(
        string $table,
        string $recordType,
        array $payload,
        array $row,
        int $sourceRecordId
    ): void {
        if ($recordType === 'GTF') {
            $gtfNumber = $payload['gtf_number'] ?? null;

            if ($gtfNumber !== null) {
                $existing = DB::table('gtfs')
                    ->where('gtf_number', $gtfNumber)
                    ->first();

                // El caso "mismo source_record" ya se trato como
                // already_persisted antes de llegar aqui; un choque de unique
                // aqui significa otro origen.
                if ($existing !== null) {
                    throw new RuntimeException(
                        "GTF number {$gtfNumber} already exists for a different source record."
                    );
                }
            }
        }

        DB::table($table)->insert($row);
    }

    /**
     * Actualiza el estado de un source_record.
     */
    private function updateSourceRecordStatus(int $sourceRecordId, string $status): void
    {
        DB::table('source_records')
            ->where('id', $sourceRecordId)
            ->update([
                'status' => $status,
                'updated_at' => now(),
            ]);
    }

    /**
     * Decodifica el normalized_payload (jsonb) a array asociativo.
     *
     * @return array<string,mixed>
     */
    private function decodePayload(mixed $value): array
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
