# Modelo de evidencia

El núcleo de **Huella Legal Forestal** es un **grafo de evidencia**. En lugar de
guardar la información forestal solo como tablas aisladas, la conectamos como una
red de nodos y relaciones que representa cómo se vincula la realidad documental y
operativa de un aprovechamiento forestal.

## Conceptos

### Nodo

Un **nodo** (`trace_nodes`) es una pieza de evidencia o una entidad relevante del
caso: una entidad (comunidad/empresa), un título habilitante, un plan operativo,
una parcela, un árbol, un documento, un evento, etc. Cada nodo tiene:

- `node_type`: qué clase de cosa representa.
- `label`: nombre legible.
- `entity_table` + `entity_id`: referencia opcional a la fila de dominio que lo
  respalda (p. ej. la fila real en `census_trees`).
- `status` y `metadata` (jsonb).

### Relación

Una **relación** (`trace_edges`) es una conexión dirigida entre dos nodos
(`source_node_id` → `target_node_id`) con un `relation_type` (POSEE, AMPARA,
AUTORIZA, CONTIENE, REGISTRA, etc.). Las relaciones son las que dan sentido al
grafo: expresan posesión, amparo legal, autorización, contención física, etc.

### Evento

Un **evento** (`trace_events`) es algo que ocurre en el tiempo y queda
registrado: la creación del grafo semilla, una carga de datos, una verificación,
una alerta. Lleva `event_type`, opcionalmente la entidad afectada, el sistema
fuente de origen y un `payload` (jsonb) con el detalle.

### Sistema fuente

Un **sistema fuente** (`source_systems`) es el origen de la información:
SIGOsfc, alertas OSINFOR, censo forestal, libro de operaciones, balance de
extracción, GTF, CTP, etc. Cada fuente declara su `integration_type`
(MANUAL_UPLOAD, API_FUTURE, SIMULATED, SYSTEM_REFERENCE). En esta etapa las
fuentes son referencias y datos de demostración; **no hay integración real con
SIGOsfc/SNIFFS ni consumo en tiempo real**.

### Documento

Un **documento** (`documents`) es un respaldo documental asociado a las
entidades. Sus hashes (`document_hashes`) son la base sobre la que más adelante
se construirá la inmutabilidad.

## Por qué un grafo

La trazabilidad forestal es intrínsecamente relacional: un árbol pertenece a una
parcela, que pertenece a un plan, que está amparado por un título, que pertenece
a una entidad, y todo se cruza con documentos, eventos y alertas. Un grafo:

- modela esas conexiones de forma natural y navegable;
- permite recorrer la cadena en cualquier dirección (de la entidad al árbol o
  del árbol a la entidad);
- facilita detectar inconsistencias y vacíos de trazabilidad;
- alimenta directamente una visualización para el usuario.

## Por qué metadata jsonb

Las distintas fuentes traen campos heterogéneos y cambiantes. Usar columnas
`jsonb` para `metadata` (y `payload` en eventos) nos permite guardar atributos
variables por nodo, relación o evento **sin migraciones constantes**,
manteniendo a la vez las columnas estructuradas para lo esencial y los índices.

## Cómo el grafo representa el caso CCNN Bélgica

El grafo semilla del caso demo conecta:

```txt
CCNN Bélgica ──POSEE──▶ Permiso Forestal ──AMPARA──▶ PO 19 ──AUTORIZA──▶ PC 01 ──CONTIENE──▶ Árbol 3403
```

Cada flecha es una relación (`trace_edges`) y cada caja es un nodo
(`trace_nodes`). El endpoint `GET /api/graph/seed` devuelve exactamente estos
nodos y relaciones leídos desde la base de datos, listos para el frontend.

## Alcance y límites

- **El sistema no certifica legalidad automáticamente.** No emite un veredicto
  de "legal" o "ilegal".
- El sistema **representa evidencia, trazabilidad y consistencia**: organiza la
  información, muestra cómo se conecta y permite detectar vacíos o discrepancias.
- La **inmutabilidad se implementará después** mediante una cadena de hashes
  (hash chain) sobre documentos y eventos. **Hoy no existe blockchain** ni
  sellado criptográfico en producción.
