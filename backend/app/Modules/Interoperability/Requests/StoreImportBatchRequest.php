<?php

namespace App\Modules\Interoperability\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Valida el registro manual de un lote de importacion (S2-BE-04).
 *
 * Solo registra el lote; no procesa archivos, no crea source_records ni
 * proyecta el grafo de trazabilidad.
 */
class StoreImportBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
            'source_system_id' => ['nullable', 'integer', 'exists:source_systems,id'],
            'batch_code' => ['required', 'string', 'max:120', 'unique:import_batches,batch_code'],
            'name' => ['required', 'string', 'max:255'],
            'import_type' => ['required', 'string', 'max:80'],
            'source_file_name' => ['nullable', 'string', 'max:255'],
            'source_file_path' => ['nullable', 'string', 'max:500'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
