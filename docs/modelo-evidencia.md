# Modelo de Evidencia y Trazabilidad Forestal

## 1. Visión del Sistema 
Este sistema **no es un certificador legal automático**. Su objetivo no es decir "esto es legal o ilegal". Su objetivo es construir un **modelo de evidencia inmutable y navegable**. Recopilamos datos de documentos oficiales (Censo, Libro de Operaciones, GTF), los transformamos en un grafo de relaciones y marcamos dónde la cadena está completa y dónde se rompe. La confianza nace de la transparencia de los datos, no de una caja negra.

## 2. Diccionario de Nodos 
Los nodos son los actores, documentos o elementos físicos que participan en la cadena.
* `ENTIDAD`: Actor titular (Ej. Comunidad Nativa Bélgica).
* `TITULO_HABILITANTE`: El permiso macro otorgado por el Estado.
* `PLAN_OPERATIVO`: El plan de manejo de una zafra (Ej. PO 19).
* `PARCELA`: Unidad geográfica de extracción (Ej. PC 01).
* `ARBOL`: Individuo físico registrado en el bosque.
* `TROZA`: Segmento de madera resultante del trozado de un árbol.
* `DOCUMENTO`: Respaldo físico/digital (Censo, Balance, GTF).
* `EVENTO`: Acción que cambia el estado de la madera (Tala, Trozado, Despacho).

## 3. Diccionario de Relaciones 
Definen cómo se conecta un nodo con otro en el motor de trazabilidad.
* `ENTIDAD` ➔ **AMPARA** ➔ `TITULO_HABILITANTE`
* `TITULO_HABILITANTE` ➔ **AUTORIZA** ➔ `PLAN_OPERATIVO`
* `PLAN_OPERATIVO` ➔ **CONTIENE** ➔ `PARCELA`
* `PARCELA` ➔ **CONTIENE** ➔ `ARBOL`
* `ARBOL` ➔ **REGISTRA** ➔ `EVENTO_TALA`
* `EVENTO_TALA` ➔ **GENERA** ➔ `TROZA`
* `TROZA` ➔ **MOVILIZADA_EN** ➔ `EVENTO_DESPACHO`
* `EVENTO_DESPACHO` ➔ **AMPARADO_POR** ➔ `DOCUMENTO_GTF`

## 4. Estados Base del Grafo
* `DISPONIBLE`: El árbol está en pie en el bosque.
* `TRAZABLE`: La cadena de eventos está completa y consistente.
* `OBSERVADO`: Hay una discrepancia técnica (Ej. diámetro fuera de rango).
* `INCONSISTENTE`: Ruptura crítica en la cadena documental.

## 5. Evidencia del formato JSON 
```json
{
  "seed_data": {
    "entidad": {
      "id": "ENT-001",
      "nombre": "COMUNIDAD NATIVA BELGICA",
      "ruc": "20527160121"
    },
    "titulo_habilitante": {
      "id": "TH-008-15",
      "codigo": "GOREMAD-GRRNYGA-DRFFS/DFFS-TAH/P-MAD-D-008-15"
    },
    "plan_operativo": {
      "id": "PO-19",
      "nombre": "PO 19",
      "resolucion": "RGR N 1120-2025-GOREMAD-GRFFS"
    },
    "parcela": {
      "id": "PC-01",
      "nombre": "PC 01"
    },
    "nodo_raiz_arbol": {
      "id": "ARB-1000",
      "codigo_censo": "1000",
      "especie": "Jacaranda copaia (Aubl.) D. Don Achihua",
      "diametro_mayor_m": 0.71,
      "diametro_menor_m": 0.52,
      "longitud_m": 13.0,
      "volumen_m3": 3.862,
      "estado_actual": "OBSERVADO"
    },
    "eventos": [
      {
        "id_evento": "EVT-TALA-1000",
        "tipo": "TALA",
        "fecha": "2025-08-01",
        "observacion": "El valor del diametro mayor excede el rango permisible !!",
        "nodo_origen": "ARB-1000",
        "nodo_destino": "TRZ-1000-A"
      },
      {
        "id_evento": "EVT-TROZ-1000A",
        "tipo": "TROZADO",
        "fecha": "2025-08-05",
        "observacion": "Generación de troza principal",
        "nodo_origen": "TRZ-1000-A",
        "nodo_destino": "DESP-1000-A"
      },
      {
        "id_evento": "EVT-DESP-1000A",
        "tipo": "DESPACHO",
        "fecha": "2025-09-01",
        "observacion": "Despacho autorizado",
        "gtf_asociada": "017-0001271",
        "nodo_origen": "DESP-1000-A",
        "nodo_destino": "LOTE-DEMO-01"
      }
    ]
  }
}
```
