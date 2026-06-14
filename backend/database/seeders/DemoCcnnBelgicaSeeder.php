<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeder idempotente del caso demo "CCNN Belgica".
 *
 * Carga las organizaciones base, los sistemas fuente de referencia, la
 * estructura forestal (titulo -> plan operativo -> parcelas -> arbol) y
 * construye el primer grafo de evidencia:
 *
 *   CCNN Belgica -> Permiso Forestal -> PO 19 -> PC 01 -> Arbol 3403
 *
 * No usa modelos Eloquent (el proyecto aun no define ninguno) sino el query
 * builder con un helper "upsert" que garantiza idempotencia: se puede ejecutar
 * multiples veces sin duplicar filas.
 */
class DemoCcnnBelgicaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // -----------------------------------------------------------------
            // 1. Organizaciones
            // -----------------------------------------------------------------
            $osinforId = $this->upsert('organizations', ['code' => 'OSINFOR_DEMO'], [
                'name' => 'OSINFOR Demo',
                'type' => 'OSINFOR',
                'status' => 'ACTIVO',
                'metadata' => ['demo' => true],
            ]);

            $ccnnId = $this->upsert('organizations', ['code' => 'CCNN_BELGICA'], [
                'name' => 'CCNN Bélgica',
                'type' => 'COMUNIDAD_NATIVA',
                'status' => 'ACTIVO',
                'metadata' => ['demo' => true],
            ]);

            // -----------------------------------------------------------------
            // 2. Sistemas fuente
            // -----------------------------------------------------------------
            $sources = [
                ['code' => 'SIGOSFC', 'name' => 'SIGOsfc', 'type' => 'SIGOSFC', 'integration_type' => 'SYSTEM_REFERENCE'],
                ['code' => 'ALERTAS_OSINFOR', 'name' => 'Alertas OSINFOR', 'type' => 'ALERTAS_OSINFOR', 'integration_type' => 'SIMULATED'],
                ['code' => 'CENSO_FORESTAL', 'name' => 'Censo Forestal', 'type' => 'CENSO_FORESTAL', 'integration_type' => 'MANUAL_UPLOAD'],
                ['code' => 'LIBRO_OPERACIONES', 'name' => 'Libro de Operaciones', 'type' => 'LIBRO_OPERACIONES', 'integration_type' => 'MANUAL_UPLOAD'],
                ['code' => 'BALANCE_EXTRACCION', 'name' => 'Balance de Extracción', 'type' => 'BALANCE_EXTRACCION', 'integration_type' => 'MANUAL_UPLOAD'],
                ['code' => 'GTF', 'name' => 'GTF', 'type' => 'GTF', 'integration_type' => 'API_FUTURE'],
                ['code' => 'CTP', 'name' => 'CTP', 'type' => 'CTP', 'integration_type' => 'API_FUTURE'],
            ];

            foreach ($sources as $source) {
                $this->upsert('source_systems', ['code' => $source['code']], [
                    'name' => $source['name'],
                    'type' => $source['type'],
                    'integration_type' => $source['integration_type'],
                    'status' => 'ACTIVO',
                ]);
            }

            $sigosfcId = DB::table('source_systems')->where('code', 'SIGOSFC')->value('id');

            // -----------------------------------------------------------------
            // 3. Estructura forestal
            // -----------------------------------------------------------------
            $titleId = $this->upsert('forest_titles', ['code' => 'TH-CCNN-BELGICA-DEMO'], [
                'organization_id' => $ccnnId,
                'name' => 'Permiso Forestal CCNN Bélgica',
                'holder_name' => 'CCNN Bélgica',
                'title_type' => 'PERMISO_FORESTAL',
                'status' => 'VIGENTE',
                'metadata' => ['demo' => true],
            ]);

            $planId = $this->upsert('operational_plans', ['forest_title_id' => $titleId, 'code' => 'PO-19'], [
                'name' => 'PO 19',
                'status' => 'APROBADO',
                'metadata' => ['demo' => true],
            ]);

            $parcels = [
                ['code' => 'PC 01', 'trees' => 1688, 'volume' => 11328.226],
                ['code' => 'PC 02', 'trees' => 2530, 'volume' => 15088.540],
                ['code' => 'PC 03', 'trees' => 3446, 'volume' => 22547.246],
            ];

            $parcelIds = [];
            foreach ($parcels as $parcel) {
                $parcelIds[$parcel['code']] = $this->upsert('cutting_parcels', [
                    'operational_plan_id' => $planId,
                    'code' => $parcel['code'],
                ], [
                    'name' => $parcel['code'],
                    'authorized_trees_count' => $parcel['trees'],
                    'authorized_volume' => $parcel['volume'],
                    'status' => 'APROBADO',
                    'metadata' => ['demo' => true],
                ]);
            }

            $this->upsert('census_trees', [
                'cutting_parcel_id' => $parcelIds['PC 01'],
                'tree_code' => '3403',
            ], [
                'status' => 'DISPONIBLE',
                'metadata' => ['demo' => true],
            ]);

            // -----------------------------------------------------------------
            // 4. Grafo semilla: nodos
            // -----------------------------------------------------------------
            $nodeCcnn = $this->upsertNode('ENTIDAD', 'CCNN Bélgica', 'organizations', $ccnnId);
            $nodeOsinfor = $this->upsertNode('ENTIDAD', 'OSINFOR Demo', 'organizations', $osinforId);
            $nodeTitle = $this->upsertNode('TITULO_HABILITANTE', 'Permiso Forestal CCNN Bélgica', 'forest_titles', $titleId);
            $nodePlan = $this->upsertNode('PLAN_OPERATIVO', 'PO 19', 'operational_plans', $planId);
            $nodePc01 = $this->upsertNode('PARCELA', 'PC 01', 'cutting_parcels', $parcelIds['PC 01']);
            $nodePc02 = $this->upsertNode('PARCELA', 'PC 02', 'cutting_parcels', $parcelIds['PC 02']);
            $nodePc03 = $this->upsertNode('PARCELA', 'PC 03', 'cutting_parcels', $parcelIds['PC 03']);
            $treeId = DB::table('census_trees')
                ->where('cutting_parcel_id', $parcelIds['PC 01'])
                ->where('tree_code', '3403')
                ->value('id');
            $nodeTree = $this->upsertNode('ARBOL', 'Árbol 3403', 'census_trees', $treeId);

            // -----------------------------------------------------------------
            // 5. Grafo semilla: relaciones
            // -----------------------------------------------------------------
            $this->upsertEdge($nodeCcnn, $nodeTitle, 'POSEE');
            $this->upsertEdge($nodeTitle, $nodePlan, 'AMPARA');
            $this->upsertEdge($nodePlan, $nodePc01, 'AUTORIZA');
            $this->upsertEdge($nodePlan, $nodePc02, 'AUTORIZA');
            $this->upsertEdge($nodePlan, $nodePc03, 'AUTORIZA');
            $this->upsertEdge($nodePc01, $nodeTree, 'CONTIENE');
            $this->upsertEdge($nodeOsinfor, $nodeTitle, 'REGISTRA');

            // -----------------------------------------------------------------
            // 6. Evento de trazabilidad
            // -----------------------------------------------------------------
            $this->upsert('trace_events', [
                'event_type' => 'GRAFO_SEMILLA_CREADO',
                'entity_type' => 'DEMO_CASE',
            ], [
                'source_system_id' => $sigosfcId,
                'payload' => [
                    'case' => 'CCNN Bélgica',
                    'plan' => 'PO 19',
                    'tree' => '3403',
                ],
            ]);
        });
    }

    /**
     * Inserta o actualiza una fila identificada por $match y devuelve su id.
     *
     * Garantiza idempotencia: si la fila existe se actualiza, si no se crea.
     * Las claves "metadata" y "payload" se codifican como JSON para columnas
     * jsonb de PostgreSQL.
     *
     * @param  array<string, mixed>  $match
     * @param  array<string, mixed>  $values
     */
    private function upsert(string $table, array $match, array $values): int
    {
        $values = $this->encodeJsonColumns($values);

        $existing = DB::table($table)->where($match)->first();

        if ($existing !== null) {
            DB::table($table)
                ->where('id', $existing->id)
                ->update($values + ['updated_at' => now()]);

            return (int) $existing->id;
        }

        return (int) DB::table($table)->insertGetId(
            $match + $values + ['created_at' => now(), 'updated_at' => now()]
        );
    }

    /**
     * Helper para nodos del grafo, identificados por (node_type, label).
     */
    private function upsertNode(string $nodeType, string $label, string $entityTable, ?int $entityId): int
    {
        return $this->upsert('trace_nodes', [
            'node_type' => $nodeType,
            'label' => $label,
        ], [
            'entity_table' => $entityTable,
            'entity_id' => $entityId,
            'status' => 'ACTIVO',
        ]);
    }

    /**
     * Helper para relaciones del grafo, identificadas por la terna unica
     * (source_node_id, target_node_id, relation_type).
     */
    private function upsertEdge(int $sourceNodeId, int $targetNodeId, string $relationType): int
    {
        return $this->upsert('trace_edges', [
            'source_node_id' => $sourceNodeId,
            'target_node_id' => $targetNodeId,
            'relation_type' => $relationType,
        ], [
            'status' => 'ACTIVO',
        ]);
    }

    /**
     * Codifica como JSON las columnas jsonb conocidas.
     *
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    private function encodeJsonColumns(array $values): array
    {
        foreach (['metadata', 'payload'] as $jsonKey) {
            if (isset($values[$jsonKey]) && is_array($values[$jsonKey])) {
                $values[$jsonKey] = json_encode($values[$jsonKey], JSON_UNESCAPED_UNICODE);
            }
        }

        return $values;
    }
}
