<?php

namespace App\Modules\Interoperability\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Valida el cuerpo del endpoint normalize-demo (S2-BE-07).
 *
 * Recibe una lista de filas crudas en JSON. Cada fila se entrega como un objeto
 * (array asociativo clave => valor). El parsing real de Excel/PDF no forma parte
 * de este bloque: las filas llegan ya estructuradas.
 */
class NormalizeDemoImportBatchRequest extends FormRequest
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
            'rows' => ['required', 'array', 'min:1'],
            'rows.*' => ['array'],
        ];
    }
}
