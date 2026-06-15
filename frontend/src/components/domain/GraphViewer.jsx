import { useMemo } from 'react';
import EmptyState from '../common/EmptyState.jsx';

const NODE_W = 140;
const NODE_H = 52;
const LEVEL_GAP = 100;
const ROW_GAP = 80;

function nodeTypeClass(type) {
  const map = {
    ENTIDAD: 'entidad',
    TITULO_HABILITANTE: 'titulo',
    PLAN_OPERATIVO: 'plan',
    PARCELA: 'parcela',
    ARBOL: 'arbol',
    EVENTO: 'evento',
  };
  return map[type] || 'entidad';
}

function layoutGraph(nodes, edges) {
  if (!nodes?.length) return { positioned: [], svgEdges: [] };

  const nodeMap = {};
  nodes.forEach((n) => {
    nodeMap[n.id] = { ...n, x: 0, y: 0, level: 0 };
  });

  const adj = {};
  const inDeg = {};
  nodes.forEach((n) => {
    adj[n.id] = [];
    inDeg[n.id] = 0;
  });
  edges?.forEach((e) => {
    if (adj[e.source] && nodeMap[e.target]) {
      adj[e.source].push(e.target);
      inDeg[e.target] = (inDeg[e.target] || 0) + 1;
    }
  });

  const queue = [];
  nodes.forEach((n) => {
    if (!inDeg[n.id]) {
      nodeMap[n.id].level = 0;
      queue.push(n.id);
    }
  });

  let maxLevel = 0;
  const visited = new Set();
  while (queue.length) {
    const cur = queue.shift();
    if (visited.has(cur)) continue;
    visited.add(cur);
    const curLevel = nodeMap[cur].level;
    maxLevel = Math.max(maxLevel, curLevel);
    for (const nb of adj[cur] || []) {
      if (!visited.has(nb)) {
        nodeMap[nb].level = Math.max(nodeMap[nb].level, curLevel + 1);
        queue.push(nb);
      }
    }
  }

  const levels = {};
  nodes.forEach((n) => {
    const l = nodeMap[n.id].level;
    if (!levels[l]) levels[l] = [];
    levels[l].push(n.id);
  });

  for (const lvl of Object.keys(levels)) {
    const ids = levels[lvl];
    const totalW = ids.length * NODE_W + (ids.length - 1) * ROW_GAP;
    let startX = -totalW / 2 + NODE_W / 2;
    ids.forEach((id) => {
      nodeMap[id].x = startX;
      nodeMap[id].y = Number(lvl) * (NODE_H + LEVEL_GAP);
      startX += NODE_W + ROW_GAP;
    });
  }

  const positioned = nodes.map((n) => ({
    ...n,
    x: nodeMap[n.id].x,
    y: nodeMap[n.id].y,
    level: nodeMap[n.id].level,
  }));

  const svgEdges = (edges || []).flatMap((e) => {
    const src = nodeMap[e.source];
    const tgt = nodeMap[e.target];
    if (!src || !tgt) return [];
    const x1 = src.x;
    const y1 = src.y + NODE_H / 2;
    const x2 = tgt.x;
    const y2 = tgt.y - NODE_H / 2;
    const cy = (y1 + y2) / 2;
    return [{
      ...e,
      x1, y1, x2, y2,
      path: `M${x1},${y1} C${x1},${cy} ${x2},${cy} ${x2},${y2}`,
    }];
  });

  const padding = 40;
  const svgW = positioned.length > 1
    ? Math.max(...positioned.map(n => n.x)) - Math.min(...positioned.map(n => n.x)) + NODE_W + padding * 2
    : NODE_W + padding * 2;
  const svgH = maxLevel * (NODE_H + LEVEL_GAP) + NODE_H + padding * 2;

  return { positioned, svgEdges, svgW, svgH, maxLevel };
}

function nodeIdsInSubgraph(edges, centerId) {
  const ids = new Set([centerId]);
  edges?.forEach((e) => {
    if (e.source === centerId) ids.add(e.target);
    if (e.target === centerId) ids.add(e.source);
  });
  return ids;
}

export default function GraphViewer({
  nodes,
  edges,
  selectedNode,
  neighborNodeIds,
  onSelect,
}) {
  const layout = useMemo(() => layoutGraph(nodes, edges), [nodes, edges]);
  const neighborSet = useMemo(
    () => (neighborNodeIds ? new Set(neighborNodeIds) : new Set()),
    [neighborNodeIds]
  );

  if (!nodes?.length) {
    return (
      <div className="graph-container">
        <p className="muted text-sm">No hay nodos para visualizar.</p>
      </div>
    );
  }

  return (
    <div className="graph-container">
      <svg
        viewBox={`${-layout.svgW / 2} ${-layout.svgH / 2} ${layout.svgW} ${layout.svgH}`}
        className="graph-svg"
        style={{ minHeight: `${Math.max(200, layout.svgH)}px` }}
      >
        {layout.svgEdges.map((e) => {
          const isHighlighted =
            selectedNode &&
            (e.source === selectedNode.id || e.target === selectedNode.id);
          return (
            <g key={e.id || `${e.source}-${e.target}`}>
              <path
                d={e.path}
                className={`graph-edge${isHighlighted ? ' graph-edge--highlighted' : ''}`}
              />
              <polygon
                className="graph-edge-arrow"
                points={arrowPoints(e.x2, e.y2, e.x1, e.y1)}
              />
              <text
                x={(e.x1 + e.x2) / 2}
                y={(e.y1 + e.y2) / 2 - 6}
                className="graph-edge-label"
              >
                {e.relation || e.relation_type || ''}
              </text>
            </g>
          );
        })}
        {layout.positioned.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const isNeighbor = neighborSet.has(node.id);
          const typeClass = nodeTypeClass(node.type || node.node_type);
          return (
            <g
              key={node.id}
              className={`graph-node${isSelected ? ' graph-node--selected' : ''}${isNeighbor ? ' graph-node--neighbor' : ''}`}
              onClick={() => onSelect?.(node)}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
            >
              <rect
                x={node.x - NODE_W / 2}
                y={node.y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                className={`graph-node-rect graph-node-rect--${typeClass}`}
              />
              <text
                x={node.x}
                y={node.y - 4}
                className="graph-node-label"
              >
                {node.label || node.name || `Nodo ${node.id}`}
              </text>
              <text
                x={node.x}
                y={node.y + 12}
                className="graph-node-sub"
              >
                {node.type || ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function arrowPoints(x, y, fromX, fromY) {
  const angle = Math.atan2(y - fromY, x - fromX);
  const len = 8;
  const wid = 5;
  const a = angle - Math.PI / 2;
  const p1x = x - len * Math.cos(angle) + wid * Math.cos(a);
  const p1y = y - len * Math.sin(angle) + wid * Math.sin(a);
  const p2x = x;
  const p2y = y;
  const p3x = x - len * Math.cos(angle) - wid * Math.cos(a);
  const p3y = y - len * Math.sin(angle) - wid * Math.sin(a);
  return `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`;
}
