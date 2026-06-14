<?php

namespace App\Modules\Interoperability\Services;

/**
 * Normaliza filas crudas de importacion a un payload estandar (S2-BE-05).
 *
 * Este servicio NO persiste nada. Solo transforma una fila ya entregada como
 * array en una estructura normalizada y reporta errores de campos obligatorios.
 * El parsing real de Excel/PDF, la creacion de source_records y la proyeccion al
 * grafo llegan en bloques posteriores del Sprint 2.
 */
class SourceNormalizerService
{
    /**
     * Tipos de importacion soportados y la definicion de sus campos.
     *
     * Cada campo declara:
     *   - aliases: nombres de columna aceptados en la fila cruda.
     *   - type:    string | decimal | date (para coercion del valor).
     */
    private const SCHEMAS = [
        'CENSO_FORESTAL' => [
            'tree_code' => ['aliases' => ['tree_code', 'codigo_arbol', 'arbol', 'code'], 'type' => 'string'],
            'species' => ['aliases' => ['species', 'especie'], 'type' => 'string'],
            'volume_m3' => ['aliases' => ['volume_m3', 'volumen', 'volumen_m3'], 'type' => 'decimal'],
            'diameter_cm' => ['aliases' => ['diameter_cm', 'diametro', 'dap'], 'type' => 'decimal'],
            'height_m' => ['aliases' => ['height_m', 'altura'], 'type' => 'decimal'],
            'parcel_code' => ['aliases' => ['parcel_code', 'parcela', 'codigo_parcela'], 'type' => 'string'],
        ],
        'LIBRO_OPERACIONES_TALA' => [
            'tree_code' => ['aliases' => ['tree_code', 'codigo_arbol', 'arbol', 'code'], 'type' => 'string'],
            'species' => ['aliases' => ['species', 'especie'], 'type' => 'string'],
            'volume_m3' => ['aliases' => ['volume_m3', 'volumen', 'volumen_m3'], 'type' => 'decimal'],
            'operation_date' => ['aliases' => ['operation_date', 'fecha', 'fecha_operacion'], 'type' => 'date'],
            'operator_name' => ['aliases' => ['operator_name', 'operador', 'nombre_operador'], 'type' => 'string'],
        ],
        'LIBRO_OPERACIONES_TROZADO' => [
            'piece_code' => ['aliases' => ['piece_code', 'codigo_pieza', 'pieza', 'troza'], 'type' => 'string'],
            'tree_code' => ['aliases' => ['tree_code', 'codigo_arbol', 'arbol', 'code'], 'type' => 'string'],
            'species' => ['aliases' => ['species', 'especie'], 'type' => 'string'],
            'length_m' => ['aliases' => ['length_m', 'largo', 'longitud'], 'type' => 'decimal'],
            'diameter_cm' => ['aliases' => ['diameter_cm', 'diametro', 'dap'], 'type' => 'decimal'],
            'volume_m3' => ['aliases' => ['volume_m3', 'volumen', 'volumen_m3'], 'type' => 'decimal'],
            'operation_date' => ['aliases' => ['operation_date', 'fecha', 'fecha_operacion'], 'type' => 'date'],
        ],
        'LIBRO_OPERACIONES_DESPACHO' => [
            'despacho_code' => ['aliases' => ['despacho_code', 'codigo_despacho', 'despacho'], 'type' => 'string'],
            'dispatch_document' => ['aliases' => ['dispatch_document', 'documento', 'documento_despacho', 'guia'], 'type' => 'string'],
            'destination' => ['aliases' => ['destination', 'destino'], 'type' => 'string'],
            'species' => ['aliases' => ['species', 'especie'], 'type' => 'string'],
            'total_volume_m3' => ['aliases' => ['total_volume_m3', 'volumen_total', 'volumen', 'volumen_m3'], 'type' => 'decimal'],
            'operation_date' => ['aliases' => ['operation_date', 'fecha', 'fecha_operacion'], 'type' => 'date'],
        ],
        'BALANCE_EXTRACCION' => [
            'balance_code' => ['aliases' => ['balance_code', 'codigo_balance', 'balance'], 'type' => 'string'],
            'species' => ['aliases' => ['species', 'especie'], 'type' => 'string'],
            'authorized_volume_m3' => ['aliases' => ['authorized_volume_m3', 'volumen_autorizado'], 'type' => 'decimal'],
            'extracted_volume_m3' => ['aliases' => ['extracted_volume_m3', 'volumen_extraido'], 'type' => 'decimal'],
            'remaining_volume_m3' => ['aliases' => ['remaining_volume_m3', 'volumen_restante', 'saldo'], 'type' => 'decimal'],
            'period_start' => ['aliases' => ['period_start', 'periodo_inicio', 'fecha_inicio'], 'type' => 'date'],
            'period_end' => ['aliases' => ['period_end', 'periodo_fin', 'fecha_fin'], 'type' => 'date'],
        ],
        'GTF' => [
            'gtf_number' => ['aliases' => ['gtf_number', 'numero_gtf', 'gtf', 'numero'], 'type' => 'string'],
            'issue_date' => ['aliases' => ['issue_date', 'fecha_emision', 'fecha'], 'type' => 'date'],
            'origin' => ['aliases' => ['origin', 'origen'], 'type' => 'string'],
            'destination' => ['aliases' => ['destination', 'destino'], 'type' => 'string'],
            'transporter_name' => ['aliases' => ['transporter_name', 'transportista', 'nombre_transportista'], 'type' => 'string'],
            'vehicle_plate' => ['aliases' => ['vehicle_plate', 'placa', 'placa_vehiculo'], 'type' => 'string'],
            'species' => ['aliases' => ['species', 'especie'], 'type' => 'string'],
            'volume_m3' => ['aliases' => ['volume_m3', 'volumen', 'volumen_m3'], 'type' => 'decimal'],
        ],
    ];

    /**
     * Campos clave minimos por tipo. Cada entrada es una lista de campos en la
     * que basta con que UNO este presente para considerar la fila valida.
     */
    private const REQUIRED_FIELDS = [
        'CENSO_FORESTAL' => [['tree_code']],
        'LIBRO_OPERACIONES_TALA' => [['tree_code']],
        'LIBRO_OPERACIONES_TROZADO' => [['piece_code']],
        'LIBRO_OPERACIONES_DESPACHO' => [['despacho_code', 'dispatch_document']],
        'BALANCE_EXTRACCION' => [['balance_code', 'species']],
        'GTF' => [['gtf_number']],
    ];

    /**
     * Normaliza una fila cruda segun el tipo de importacion.
     *
     * @param  string  $importType  Uno de los tipos soportados en SCHEMAS.
     * @param  array<string,mixed>  $row  Fila cruda (clave => valor).
     * @param  array<string,string>  $mapping  Mapeo opcional columna_origen => campo_canonico.
     * @return array{import_type:string,normalized:array<string,mixed>,errors:array<int,array<string,string>>}
     */
    public function normalizeRow(string $importType, array $row, array $mapping = []): array
    {
        $importType = strtoupper(trim($importType));

        if (! isset(self::SCHEMAS[$importType])) {
            return [
                'import_type' => $importType,
                'normalized' => [],
                'errors' => [[
                    'field' => 'import_type',
                    'code' => 'UNSUPPORTED_IMPORT_TYPE',
                    'message' => "Import type {$importType} is not supported.",
                ]],
            ];
        }

        // Aplicar mapeo explicito primero: renombra columnas de origen al campo
        // canonico antes de resolver por alias.
        $row = $this->applyMapping($row, $mapping);
        // Normalizar claves de la fila para tolerar mayusculas/espacios.
        $row = $this->normalizeKeys($row);

        $schema = self::SCHEMAS[$importType];
        $normalized = [];

        foreach ($schema as $field => $definition) {
            $rawValue = $this->resolveByAlias($row, $definition['aliases']);

            if ($rawValue === null) {
                $normalized[$field] = null;

                continue;
            }

            $normalized[$field] = $this->coerce($rawValue, $definition['type']);
        }

        $errors = $this->detectMissingRequired($importType, $normalized);

        return [
            'import_type' => $importType,
            'normalized' => $normalized,
            'errors' => $errors,
        ];
    }

    /**
     * Lista de tipos de importacion soportados.
     *
     * @return array<int,string>
     */
    public function supportedTypes(): array
    {
        return array_keys(self::SCHEMAS);
    }

    /**
     * Renombra las columnas de origen al campo canonico segun $mapping.
     *
     * @param  array<string,mixed>  $row
     * @param  array<string,string>  $mapping
     * @return array<string,mixed>
     */
    private function applyMapping(array $row, array $mapping): array
    {
        if ($mapping === []) {
            return $row;
        }

        foreach ($mapping as $sourceColumn => $canonicalField) {
            if (! is_string($sourceColumn) || ! is_string($canonicalField)) {
                continue;
            }

            if (array_key_exists($sourceColumn, $row) && ! array_key_exists($canonicalField, $row)) {
                $row[$canonicalField] = $row[$sourceColumn];
            }
        }

        return $row;
    }

    /**
     * Normaliza las claves de la fila a minusculas sin espacios envolventes.
     *
     * @param  array<string,mixed>  $row
     * @return array<string,mixed>
     */
    private function normalizeKeys(array $row): array
    {
        $result = [];

        foreach ($row as $key => $value) {
            if (! is_string($key)) {
                $result[$key] = $value;

                continue;
            }

            $result[strtolower(trim($key))] = $value;
        }

        return $result;
    }

    /**
     * Devuelve el primer valor no vacio que coincida con algun alias.
     *
     * @param  array<string,mixed>  $row
     * @param  array<int,string>  $aliases
     */
    private function resolveByAlias(array $row, array $aliases): mixed
    {
        foreach ($aliases as $alias) {
            $alias = strtolower(trim($alias));

            if (! array_key_exists($alias, $row)) {
                continue;
            }

            $value = $row[$alias];

            if ($value === null) {
                continue;
            }

            if (is_string($value) && trim($value) === '') {
                continue;
            }

            return $value;
        }

        return null;
    }

    /**
     * Convierte un valor crudo al tipo canonico declarado.
     */
    private function coerce(mixed $value, string $type): mixed
    {
        return match ($type) {
            'decimal' => $this->toDecimal($value),
            'date' => $this->toDate($value),
            default => $this->cleanString($value),
        };
    }

    /**
     * Limpia un string: castea a texto y colapsa espacios redundantes.
     */
    private function cleanString(mixed $value): ?string
    {
        if (is_array($value)) {
            return null;
        }

        $string = trim((string) $value);

        if ($string === '') {
            return null;
        }

        return preg_replace('/\s+/', ' ', $string);
    }

    /**
     * Convierte un valor a decimal (float). Tolera separadores de miles y coma
     * decimal estilo latino ("1.234,56" => 1234.56).
     */
    private function toDecimal(mixed $value): ?float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (! is_string($value)) {
            return null;
        }

        $string = trim($value);

        if ($string === '') {
            return null;
        }

        // Conservar solo digitos, separadores y signo.
        $string = preg_replace('/[^0-9,.\-]/', '', $string);

        if ($string === '' || $string === '-') {
            return null;
        }

        $hasComma = str_contains($string, ',');
        $hasDot = str_contains($string, '.');

        if ($hasComma && $hasDot) {
            // El ultimo separador que aparezca es el decimal.
            if (strrpos($string, ',') > strrpos($string, '.')) {
                $string = str_replace('.', '', $string);
                $string = str_replace(',', '.', $string);
            } else {
                $string = str_replace(',', '', $string);
            }
        } elseif ($hasComma) {
            // Solo coma: tratarla como separador decimal.
            $string = str_replace(',', '.', $string);
        }

        if (! is_numeric($string)) {
            return null;
        }

        return (float) $string;
    }

    /**
     * Convierte un string de fecha simple a formato canonico Y-m-d.
     * Acepta Y-m-d, d/m/Y y d-m-Y. Si no se reconoce, devuelve null.
     */
    private function toDate(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $string = trim($value);

        if ($string === '') {
            return null;
        }

        // ISO ya canonico (posible con hora): tomar la parte de fecha.
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $string, $m)) {
            return $this->buildDate((int) $m[1], (int) $m[2], (int) $m[3]);
        }

        // d/m/Y o d-m-Y.
        if (preg_match('#^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$#', $string, $m)) {
            return $this->buildDate((int) $m[3], (int) $m[2], (int) $m[1]);
        }

        return null;
    }

    /**
     * Valida y formatea una fecha calendario a Y-m-d. Null si es invalida.
     */
    private function buildDate(int $year, int $month, int $day): ?string
    {
        if (! checkdate($month, $day, $year)) {
            return null;
        }

        return sprintf('%04d-%02d-%02d', $year, $month, $day);
    }

    /**
     * Genera errores REQUIRED_FIELD_MISSING para los campos clave ausentes.
     *
     * @param  array<string,mixed>  $normalized
     * @return array<int,array<string,string>>
     */
    private function detectMissingRequired(string $importType, array $normalized): array
    {
        $errors = [];
        $groups = self::REQUIRED_FIELDS[$importType] ?? [];

        foreach ($groups as $group) {
            $satisfied = false;

            foreach ($group as $field) {
                if (($normalized[$field] ?? null) !== null) {
                    $satisfied = true;

                    break;
                }
            }

            if ($satisfied) {
                continue;
            }

            // Reportar el primer campo del grupo como representativo.
            $field = $group[0];
            $errors[] = [
                'field' => $field,
                'code' => 'REQUIRED_FIELD_MISSING',
                'message' => "Required field {$field} is missing.",
            ];
        }

        return $errors;
    }
}
