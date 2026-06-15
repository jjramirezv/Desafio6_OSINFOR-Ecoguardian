# Arquitectura — Huella Legal backend

## Qué es la Huella Legal

La **Huella Legal** es la representación backend de un **subgrafo verificable**
de un lote de importación ya procesado por el conector interoperable. Reúne, en
una sola estructura, toda la evidencia técnica disponible sobre la cadena de un
lote:

- **Lote de importación** (`import_batches`) con sus contadores.
- **Registros fuente** (`source_records`) normalizados del lote.
- **Errores de importación** (`import_errors`) detectados durante la normalización.
- **Registros operativos** persistidos: `operation_tala`, `operation_trozado`,
  `operation_despacho`, `extraction_balances`, `gtfs`.
- **Subgrafo de trazabilidad**: el nodo del lote (`trace_nodes`), sus relaciones
  salientes (`trace_edges`) y los nodos destino.
- **Eventos del grafo** (`trace_events`) asociados al lote.

Se calcula bajo demanda (no se persiste) a partir de los datos ya existentes.

## Qué NO es

> La Huella Legal **no certifica legalidad** ni **declara ilegalidad**.

- **No** emite un veredicto LEGAL/ILEGAL.
- **No** aplica reglas jurídicas ni interpreta normativa forestal.
- **No** usa IA ni blockchain.
- Solo **resume la evidencia técnica** (registros, errores, grafo y eventos) y
  describe el **estado técnico** de la cadena para que una persona revisora pueda
  evaluarla.

## Estados técnicos

El estado se deriva exclusivamente de la evidencia disponible:

| Estado       | Condición                                                         | Lectura |
| ------------ | ---------------------------------------------------------------- | ------- |
| `OBSERVED`   | El lote tiene **errores de importación**.                         | Hay observaciones que deben revisarse. |
| `INCOMPLETE` | **No hay** `source_records` **o no hay** nodos de grafo.          | Falta evidencia. |
| `TRACEABLE`  | Hay `source_records`, registros operativos o grafo, y **sin errores**. | Trazabilidad técnica suficiente para revisión. |

La prioridad de evaluación es: **OBSERVED → INCOMPLETE → TRACEABLE**. Es decir,
si hay errores el estado es `OBSERVED` aunque exista grafo; si no hay errores
pero falta evidencia base, es `INCOMPLETE`.

## Completitud y score

`computeCompleteness` resume qué evidencia acompaña al lote y calcula un **score
técnico (0-100)**. El score es un indicador de cobertura de evidencia, **no** un
juicio de legalidad.

| Señal                      | Aporte |
| -------------------------- | ------ |
| `has_source_records`       | +40    |
| `has_operational_records`  | +20    |
| `has_graph`                | +20    |
| `has_errors`               | −20    |

El resultado se acota a `[0, 100]`. Un lote completo y sin errores obtiene **80**.

```json
{
  "has_source_records": true,
  "has_operational_records": true,
  "has_graph": true,
  "has_errors": false,
  "score": 80
}
```

## Componentes

- `app/Modules/LegalFootprint/Services/LegalFootprintService.php`
  - `buildFromImportBatch(int $importBatchId): array` — arma la huella completa;
    lanza `InvalidArgumentException` si el lote no existe.
  - `computeStatus(array $footprint): string` — deriva el estado técnico.
  - `computeCompleteness(array $footprint): array` — resume completitud y score.
- `app/Modules/LegalFootprint/Controllers/LegalFootprintController.php`
  - `show()` — huella completa.
  - `summary()` — vista compacta para verificación técnica.

Todas las consultas usan `DB::table` (sin Eloquent), alineadas con el conector
interoperable y el módulo de grafo.

## Endpoints

| Método | Ruta                                                  | Descripción |
| ------ | ----------------------------------------------------- | ----------- |
| GET    | `/api/import-batches/{id}/legal-footprint`            | Huella completa (subgrafo verificable). |
| GET    | `/api/import-batches/{id}/legal-footprint/summary`    | Resumen compacto con conteos, score y mensaje técnico. |

Si el lote no existe, ambos responden **404**.

## Relación con otros módulos

La Huella Legal es **solo lectura**: consume lo que producen el conector
(Sprint 2) y la proyección de grafo (Sprint 2/3). No modifica ingesta,
normalización ni proyección.
