import type { LineageEdge, TableNode, LineageGraph, ColumnLineage } from '../types/lineage';

/**
 * Build a parent-child relationship map from lineage edges
 */
export function buildLineageMap(edges: LineageEdge[]): Map<string, string[]> {
  const parentMap = new Map<string, string[]>();
  
  edges.forEach(({ target, source }) => {
    if (!parentMap.has(target)) {
      parentMap.set(target, []);
    }
    parentMap.get(target)!.push(source);
  });
  
  return parentMap;
}

/**
 * Build a child relationship map from lineage edges
 */
export function buildChildMap(edges: LineageEdge[]): Map<string, string[]> {
  const childMap = new Map<string, string[]>();
  
  edges.forEach(({ target, source }) => {
    if (!childMap.has(source)) {
      childMap.set(source, []);
    }
    childMap.get(source)!.push(target);
  });
  
  return childMap;
}

/**
 * Get all unique table names from edges
 */
export function getAllTables(edges: LineageEdge[]): Set<string> {
  const tables = new Set<string>();
  
  edges.forEach(({ target, source }) => {
    tables.add(target);
    tables.add(source);
  });
  
  return tables;
}

/**
 * Calculate the level (depth) of each table in the lineage tree
 * Level 0 = root (final table), higher levels = upstream sources
 */
export function calculateLevels(
  rootTable: string,
  edges: LineageEdge[]
): Map<string, number> {
  const levels = new Map<string, number>();
  const parentMap = buildLineageMap(edges);
  
  // BFS to assign levels
  const queue: Array<{ table: string; level: number }> = [
    { table: rootTable, level: 0 }
  ];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const { table, level } = queue.shift()!;
    
    if (visited.has(table)) continue;
    visited.add(table);
    levels.set(table, level);
    
    // Add parent tables at next level
    const parents = parentMap.get(table) || [];
    parents.forEach(parent => {
      if (!visited.has(parent)) {
        queue.push({ table: parent, level: level + 1 });
      }
    });
  }
  
  return levels;
}

/**
 * Build initial lineage graph with only root table visible
 */
export function buildInitialGraph(
  rootTable: string,
  allEdges: LineageEdge[],
  columnLineages: ColumnLineage[] = []
): LineageGraph {
  const parentMap = buildLineageMap(allEdges);
  const childMap = buildChildMap(allEdges);
  
  const nodes = new Map<string, TableNode>();
  
  // Create root node
  const rootParents = parentMap.get(rootTable) || [];
  const rootChildren = childMap.get(rootTable) || [];
  nodes.set(rootTable, {
    id: rootTable,
    label: formatTableName(rootTable),
    type: 'table',
    hasParents: rootParents.length > 0,
    hasChildren: rootChildren.length > 0,
    isExpanded: false,
    isChildrenExpanded: false,
    showColumns: false,
    level: 0,
    parentIds: rootParents,
    childIds: rootChildren
  });
  
  return {
    nodes,
    edges: [],
    columnLineages,
    rootTableId: rootTable
  };
}

/**
 * Expand a node to show its parent tables
 */
export function expandNode(
  graph: LineageGraph,
  nodeId: string,
  allEdges: LineageEdge[]
): LineageGraph {
  const node = graph.nodes.get(nodeId);
  if (!node || node.isExpanded || !node.hasParents) {
    return graph; // Already expanded or no parents
  }
  
  const parentMap = buildLineageMap(allEdges);
  const childMap = buildChildMap(allEdges);
  const levels = calculateLevels(graph.rootTableId, allEdges);
  const newNodes = new Map(graph.nodes);
  const newEdges = [...graph.edges];
  
  // Mark current node as expanded
  newNodes.set(nodeId, {
    ...node,
    isExpanded: true,
    expandedBy: nodeId
  });
  
  // Add parent nodes
  const parents = parentMap.get(nodeId) || [];
  parents.forEach(parentId => {
    if (!newNodes.has(parentId)) {
      const parentParents = parentMap.get(parentId) || [];
      const parentChildren = childMap.get(parentId) || [];
      newNodes.set(parentId, {
        id: parentId,
        label: formatTableName(parentId),
        type: 'table',
        hasParents: parentParents.length > 0,
        hasChildren: parentChildren.length > 0,
        isExpanded: false,
        isChildrenExpanded: false,
        expandedBy: nodeId,  // Track which node expanded this
        showColumns: false,
        level: levels.get(parentId) || 0,
        parentIds: parentParents,
        childIds: [nodeId]
      });
    }
    
    // Add edge from parent to current node
    const edge = allEdges.find(e => e.target === nodeId && e.source === parentId);
    if (edge && !newEdges.some(e => e.target === nodeId && e.source === parentId)) {
      newEdges.push(edge);
    }
  });
  
  return {
    ...graph,
    nodes: newNodes,
    edges: newEdges
  };
}

/**
 * Expand children of a node to show downstream consumers
 */
export function expandChildren(
  graph: LineageGraph,
  nodeId: string,
  allEdges: LineageEdge[]
): LineageGraph {
  const node = graph.nodes.get(nodeId);
  if (!node || node.isChildrenExpanded || !node.hasChildren) {
    return graph; // Already expanded or no children
  }
  
  const childMap = buildChildMap(allEdges);
  const parentMap = buildLineageMap(allEdges);
  const newNodes = new Map(graph.nodes);
  const newEdges = [...graph.edges];
  
  // Mark current node as children expanded
  newNodes.set(nodeId, {
    ...node,
    isChildrenExpanded: true,
    childrenExpandedBy: nodeId
  });
  
  // Add child nodes (at level - 1, since children are downstream)
  const children = childMap.get(nodeId) || [];
  children.forEach(childId => {
    if (!newNodes.has(childId)) {
      const childParents = parentMap.get(childId) || [];
      const childChildren = childMap.get(childId) || [];
      const childNode: TableNode = {
        id: childId,
        label: formatTableName(childId),
        type: 'table',
        hasParents: childParents.length > 0,
        hasChildren: childChildren.length > 0,
        isExpanded: false,
        isChildrenExpanded: false,
        childrenExpandedBy: nodeId,  // Track which node expanded this
        showColumns: false,
        level: node.level - 1,
        parentIds: childParents,
        childIds: childChildren
      };
      newNodes.set(childId, childNode);
    }
    
    // Add edge from current node to child
    const edge = allEdges.find(e => e.source === nodeId && e.target === childId);
    if (edge && !newEdges.some(e => e.source === nodeId && e.target === childId)) {
      newEdges.push(edge);
    }
  });
  
  return {
    ...graph,
    nodes: newNodes,
    edges: newEdges
  };
}

/**
 * Collapse a node to hide its parent tables
 * Only removes parents that are part of THIS node's expansion branch
 */
export function collapseNode(
  graph: LineageGraph,
  nodeId: string
): LineageGraph {
  const node = graph.nodes.get(nodeId);
  if (!node || !node.isExpanded) {
    return graph; // Not expanded
  }
  
  const newNodes = new Map(graph.nodes);
  const nodesToRemove = new Set<string>();
  
  // Recursively remove all descendants in the parent tree
  const findAllParentDescendants = (parentId: string) => {
    const parentNode = newNodes.get(parentId);
    if (parentNode && !nodesToRemove.has(parentId)) {
      nodesToRemove.add(parentId);
      
      // Recursively remove all of this parent's parents
      if (parentNode.parentIds.length > 0) {
        parentNode.parentIds.forEach(grandparentId => {
          findAllParentDescendants(grandparentId);
        });
      }
    }
  };
  
  // Remove all direct parents and their entire parent trees
  node.parentIds.forEach(parentId => {
    findAllParentDescendants(parentId);
  });
  
  // Remove all nodes in this branch
  nodesToRemove.forEach(id => {
    newNodes.delete(id);
  });
  
  // Mark clicked node as collapsed
  newNodes.set(nodeId, { ...node, isExpanded: false, expandedBy: undefined });
  
  // Filter out edges connected to removed nodes
  const newEdges = graph.edges.filter(e => {
    return newNodes.has(e.source) && newNodes.has(e.target);
  });
  
  return {
    ...graph,
    nodes: newNodes,
    edges: newEdges
  };
}

/**
 * Collapse children of a node
 * Only removes children that are part of THIS node's expansion branch
 */
export function collapseChildren(
  graph: LineageGraph,
  nodeId: string
): LineageGraph {
  const node = graph.nodes.get(nodeId);
  if (!node || !node.isChildrenExpanded) {
    return graph; // Not expanded
  }
  
  const newNodes = new Map(graph.nodes);
  const nodesToRemove = new Set<string>();
  
  // Recursively remove all descendants in the children tree
  const findAllChildDescendants = (childId: string) => {
    const childNode = newNodes.get(childId);
    if (childNode && !nodesToRemove.has(childId)) {
      nodesToRemove.add(childId);
      
      // Recursively remove all of this child's children
      if (childNode.childIds.length > 0) {
        childNode.childIds.forEach(grandchildId => {
          findAllChildDescendants(grandchildId);
        });
      }
    }
  };
  
  // Remove all direct children and their entire child trees
  node.childIds.forEach(childId => {
    findAllChildDescendants(childId);
  });
  
  // Remove all nodes in this branch
  nodesToRemove.forEach(id => {
    newNodes.delete(id);
  });
  
  // Mark clicked node as collapsed
  newNodes.set(nodeId, { ...node, isChildrenExpanded: false, childrenExpandedBy: undefined });
  
  // Filter out edges connected to removed nodes
  const newEdges = graph.edges.filter(e => {
    return newNodes.has(e.source) && newNodes.has(e.target);
  });
  
  return {
    ...graph,
    nodes: newNodes,
    edges: newEdges
  };
}

/**
 * Expand all nodes recursively (both parents and children)
 */
export function expandAll(
  graph: LineageGraph,
  allEdges: LineageEdge[]
): LineageGraph {
  let currentGraph = graph;
  let hasChanges = true;
  
  // Keep expanding until no more nodes can be expanded
  while (hasChanges) {
    hasChanges = false;
    
    // Expand all nodes with parents (upstream)
    const nodesToExpandParents = Array.from(currentGraph.nodes.values())
      .filter(node => !node.isExpanded && node.hasParents);
    
    nodesToExpandParents.forEach(node => {
      currentGraph = expandNode(currentGraph, node.id, allEdges);
      hasChanges = true;
    });
    
    // Expand all nodes with children (downstream)
    const nodesToExpandChildren = Array.from(currentGraph.nodes.values())
      .filter(node => !node.isChildrenExpanded && node.hasChildren);
    
    nodesToExpandChildren.forEach(node => {
      currentGraph = expandChildren(currentGraph, node.id, allEdges);
      hasChanges = true;
    });
    
    if (nodesToExpandParents.length === 0 && nodesToExpandChildren.length === 0) break;
  }
  
  return currentGraph;
}
/**
 * Collapse all nodes back to root
 */
export function collapseAll(graph: LineageGraph): LineageGraph {
  const newNodes = new Map<string, TableNode>();
  
  // Keep only root node
  const rootNode = graph.nodes.get(graph.rootTableId);
  if (rootNode) {
    newNodes.set(graph.rootTableId, {
      ...rootNode,
      isExpanded: false,
      isChildrenExpanded: false,
      expandedBy: undefined,
      childrenExpandedBy: undefined
    });
  }
  
  return {
    ...graph,
    nodes: newNodes,
    edges: []
  };
}

/**
 * Toggle column visibility for a node
 */
export function toggleNodeColumns(
  graph: LineageGraph,
  nodeId: string
): LineageGraph {
  const node = graph.nodes.get(nodeId);
  if (!node) return graph;
  
  const newShowColumns = !node.showColumns;
  const newNodes = new Map(graph.nodes);
  
  // Toggle the clicked node
  newNodes.set(nodeId, {
    ...node,
    showColumns: newShowColumns
  });
  
  // If showing columns, also show columns on all connected nodes
  if (newShowColumns) {
    // Show columns on all parent nodes
    node.parentIds.forEach(parentId => {
      const parentNode = newNodes.get(parentId);
      if (parentNode) {
        newNodes.set(parentId, {
          ...parentNode,
          showColumns: true
        });
      }
    });
    
    // Show columns on all child nodes
    node.childIds.forEach(childId => {
      const childNode = newNodes.get(childId);
      if (childNode) {
        newNodes.set(childId, {
          ...childNode,
          showColumns: true
        });
      }
    });
  }
  
  return {
    ...graph,
    nodes: newNodes
  };
}

/**
 * Get column lineages for a specific table
 */
export function getColumnLineagesForTable(
  tableName: string,
  columnLineages: ColumnLineage[],
  direction: 'incoming' | 'outgoing' = 'incoming'
): ColumnLineage[] {
  if (direction === 'incoming') {
    return columnLineages.filter(cl => cl.targetTable === tableName);
  } else {
    return columnLineages.filter(cl => cl.sourceTable === tableName);
  }
}

/**
 * Format table name for display
 */
function formatTableName(tableName: string): string {
  // Remove schema prefix if present (e.g., "schema.table" -> "table")
  const parts = tableName.split('.');
  return parts[parts.length - 1];
}
