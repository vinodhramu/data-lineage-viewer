import type { Node } from 'reactflow';
import type { TableNode, LayoutConfig, LayoutDirection } from '../types/lineage';
import type { TableNodeData } from '../components/TableNode';

/**
 * Calculate positions for nodes in a hierarchical layout
 * Supports both horizontal (left-to-right) and vertical (top-to-bottom) layouts
 */
export function calculateHierarchicalLayout(
  tableNodes: Map<string, TableNode>,
  config: LayoutConfig
): Node<TableNodeData>[] {
  const { direction, nodeSpacing, levelSpacing } = config;
  
  // Group nodes by level
  const nodesByLevel = new Map<number, TableNode[]>();
  tableNodes.forEach(node => {
    if (!nodesByLevel.has(node.level)) {
      nodesByLevel.set(node.level, []);
    }
    nodesByLevel.get(node.level)!.push(node);
  });
  
  const reactFlowNodes: Node<TableNodeData>[] = [];
  const maxLevel = Math.max(...Array.from(nodesByLevel.keys()));
  
  // Calculate positions for each level
  nodesByLevel.forEach((nodes, level) => {
    nodes.forEach((node, index) => {
      const position = calculateNodePosition(
        level,
        index,
        nodes.length,
        maxLevel,
        direction,
        nodeSpacing,
        levelSpacing
      );
      
      reactFlowNodes.push({
        id: node.id,
        type: 'tableNode',
        position,
        data: {
          node,
          layoutDirection: direction
        }
      });
    });
  });
  
  return reactFlowNodes;
}

/**
 * Calculate position for a single node
 */
function calculateNodePosition(
  level: number,
  index: number,
  _totalNodesInLevel: number,
  maxLevel: number,
  direction: LayoutDirection,
  nodeSpacing: number,
  levelSpacing: number
): { x: number; y: number } {
  if (direction === 'horizontal') {
    // Horizontal layout: sources (parents) on LEFT, target on RIGHT
    // Level 0 (root/target) should be on the right
    const x = (maxLevel - level) * levelSpacing;
    const y = index * nodeSpacing + (index * 50); // Extra spacing between nodes
    return { x, y };
  } else {
    // Vertical layout: target on TOP, sources (parents) below
    const x = index * nodeSpacing + (index * 50);
    const y = level * levelSpacing;
    return { x, y };
  }
}

/**
 * Calculate improved layout with centering and alignment
 * Uses absolute positioning so existing nodes don't move when new nodes are added
 * Maintains parent-child vertical ordering
 */
export function calculateCenteredLayout(
  tableNodes: Map<string, TableNode>,
  config: LayoutConfig
): Node<TableNodeData>[] {
  const { direction, nodeSpacing, levelSpacing } = config;
  
  // Group nodes by level
  const nodesByLevel = new Map<number, TableNode[]>();
  tableNodes.forEach(node => {
    if (!nodesByLevel.has(node.level)) {
      nodesByLevel.set(node.level, []);
    }
    nodesByLevel.get(node.level)!.push(node);
  });
  
  const reactFlowNodes: Node<TableNodeData>[] = [];
  const maxNodesInLevel = Math.max(...Array.from(nodesByLevel.values()).map(arr => arr.length));
  
  // Track the order index of nodes for proper child ordering
  // This represents the position in the sorted array, not the actual X/Y coordinate
  const nodeOrderIndex = new Map<string, number>(); // nodeId -> order index at that level
  
  // Calculate dynamic spacing based on node heights/widths
  const getNodeHeight = (node: TableNode): number => {
    const baseHeight = 200; // Approximate base node height
    if (node.showColumns && node.metadata?.columns) {
      return baseHeight + (node.metadata.columns.length * 35); // ~35px per column
    }
    return baseHeight;
  };
  
  const getNodeWidth = (node: TableNode): number => {
    const baseWidth = 300; // Approximate base node width
    if (node.showColumns && node.metadata?.columns) {
      // With columns visible, the node is wider
      return Math.max(baseWidth, 350);
    }
    return baseWidth;
  };
  
  // Use absolute positioning:
  // Horizontal: level 0 at X=0, parents at negative X (left), same level nodes stacked vertically
  // Vertical: level 0 at Y=0, parents at negative Y (above), same level nodes arranged horizontally
  // Process levels in order (0, 1, 2, ...) so parent positions are known before sorting children
  const levels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);
  
  levels.forEach((level) => {
    const nodes = nodesByLevel.get(level)!;
    
    // Sort nodes to maintain consistent ordering at ALL levels
    if (level === 0) {
      // Level 0: sort by node ID for consistent ordering
      nodes.sort((a, b) => a.id.localeCompare(b.id));
    } else {
      // Children: First sort by their parent's order index, then by their own ID for tie-breaking
      nodes.sort((a, b) => {
        // Find the FIRST parent's order index for each node
        let aParentOrder = Infinity;
        for (const parentId of a.parentIds) {
          const order = nodeOrderIndex.get(parentId);
          if (order !== undefined && order < aParentOrder) {
            aParentOrder = order;
          }
        }
        
        let bParentOrder = Infinity;
        for (const parentId of b.parentIds) {
          const order = nodeOrderIndex.get(parentId);
          if (order !== undefined && order < bParentOrder) {
            bParentOrder = order;
          }
        }
        
        // If parents have different order, use that
        if (aParentOrder !== bParentOrder) {
          return aParentOrder - bParentOrder;
        }
        
        // If same parent (or both have no parent), sort by node ID for consistency
        return a.id.localeCompare(b.id);
      });
    }
    
    // Store the order index for each node AFTER sorting
    nodes.forEach((node, index) => {
      nodeOrderIndex.set(node.id, index);
    });
    
    if (direction === 'horizontal') {
      // HORIZONTAL LAYOUT: Same level nodes stack vertically (top to bottom)
      // Calculate total height needed for this level
      const totalHeight = nodes.reduce((sum, node) => sum + getNodeHeight(node), 0);
      const gaps = Math.max(0, nodes.length - 1) * 50; // 50px gap between nodes
      const levelHeight = totalHeight + gaps;
      
      // Start Y position (centered) - this is the TOP of the first node
      let currentY = -levelHeight / 2;
      
      nodes.forEach((node) => {
        const nodeHeight = getNodeHeight(node);
        // Horizontal: level 0 at X=0, parents at negative X (to the left)
        const x = -level * levelSpacing;
        // Y position is at the TOP of the node
        const y = currentY;
        const position = { x, y };
        
        // Move Y position for next node: current position + this node's height + gap
        currentY += nodeHeight + 50; // 50px gap
        
        reactFlowNodes.push({
          id: node.id,
          type: 'tableNode',
          position,
          data: {
            node,
            layoutDirection: direction
          }
        });
      });
    } else {
      // VERTICAL LAYOUT: Same level nodes arrange horizontally (left to right)
      // Calculate total width needed for this level
      const totalWidth = nodes.reduce((sum, node) => sum + getNodeWidth(node), 0);
      const gaps = Math.max(0, nodes.length - 1) * 50; // 50px gap between nodes
      const levelWidth = totalWidth + gaps;
      
      // Start X position (centered) - this is the LEFT of the first node
      let currentX = -levelWidth / 2;
      
      nodes.forEach((node) => {
        const nodeWidth = getNodeWidth(node);
        // Vertical: level 0 at Y=0, parents at negative Y (above)
        const x = currentX;
        const y = -level * levelSpacing; // Negative Y for parents (upstream)
        const position = { x, y };
        
        // Move X position for next node: current position + this node's width + gap
        currentX += nodeWidth + 50; // 50px gap
        
        reactFlowNodes.push({
          id: node.id,
          type: 'tableNode',
          position,
          data: {
            node,
            layoutDirection: direction
          }
        });
      });
    }
  });
  
  return reactFlowNodes;
}

/**
 * Dagre-like layout algorithm for better node arrangement
 * Groups nodes with shared dependencies closer together
 */
export function calculateDagreLayout(
  tableNodes: Map<string, TableNode>,
  config: LayoutConfig
): Node<TableNodeData>[] {
  const { direction, nodeSpacing, levelSpacing } = config;
  
  // Build adjacency map
  const childrenMap = new Map<string, Set<string>>();
  tableNodes.forEach(node => {
    node.parentIds.forEach(parentId => {
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, new Set());
      }
      childrenMap.get(parentId)!.add(node.id);
    });
  });
  
  // Group nodes by level
  const nodesByLevel = new Map<number, TableNode[]>();
  tableNodes.forEach(node => {
    if (!nodesByLevel.has(node.level)) {
      nodesByLevel.set(node.level, []);
    }
    nodesByLevel.get(node.level)!.push(node);
  });
  
  const reactFlowNodes: Node<TableNodeData>[] = [];
  const nodePositions = new Map<string, number>(); // Track Y/X positions
  
  // Start from root (level 0) and position children based on parent position
  nodesByLevel.forEach((nodes, level) => {
    if (level === 0) {
      // Position root node(s) at center
      nodes.forEach((node, index) => {
        nodePositions.set(node.id, index * nodeSpacing);
      });
    } else {
      // Position based on average of children positions
      nodes.forEach(node => {
        const children = childrenMap.get(node.id);
        if (children && children.size > 0) {
          const childPositions = Array.from(children)
            .map(childId => nodePositions.get(childId) || 0);
          const avgPosition = childPositions.reduce((a, b) => a + b, 0) / childPositions.length;
          nodePositions.set(node.id, avgPosition);
        } else {
          // No children positioned yet, use default
          nodePositions.set(node.id, nodePositions.size * nodeSpacing);
        }
      });
    }
  });
  
  // Create React Flow nodes with calculated positions
  tableNodes.forEach(node => {
    const crossAxisPosition = nodePositions.get(node.id) || 0;
    const mainAxisPosition = node.level * levelSpacing;
    
    const position = direction === 'horizontal'
      ? { x: mainAxisPosition, y: crossAxisPosition }
      : { x: crossAxisPosition, y: mainAxisPosition };
    
    reactFlowNodes.push({
      id: node.id,
      type: 'tableNode',
      position,
      data: {
        node,
        layoutDirection: direction
      }
    });
  });
  
  return reactFlowNodes;
}
