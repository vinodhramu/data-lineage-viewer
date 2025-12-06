import { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
} from 'reactflow';
import type { Node, Edge, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

import { TableNode } from './components/TableNode';
import type { TableNodeData } from './components/TableNode';
import { sampleLineageData, sampleColumnLineages, sampleTableMetadata } from './data/sampleLineage';
import { 
  buildInitialGraph, 
  expandNode, 
  collapseNode,
  expandChildren,
  collapseChildren,
  expandAll, 
  collapseAll,
  toggleNodeColumns 
} from './utils/lineageBuilder';
import { calculateCenteredLayout } from './utils/layoutEngine';
import type { LineageGraph, LayoutDirection } from './types/lineage';

// Register custom node type
const nodeTypes = {
  tableNode: TableNode,
};

function App() {
  console.log('App rendering...');
  
  const [lineageGraph, setLineageGraph] = useState<LineageGraph>(() => {
    console.log('Initializing lineage graph...');
    const graph = buildInitialGraph('table_final', sampleLineageData, sampleColumnLineages);
    // Add metadata to root node
    const rootNode = graph.nodes.get('table_final');
    if (rootNode) {
      graph.nodes.set('table_final', {
        ...rootNode,
        metadata: sampleTableMetadata['table_final']
      });
    }
    console.log('Graph initialized:', graph);
    return graph;
  });

  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>('horizontal');
  const [showFeatures, setShowFeatures] = useState(true);

  // Define callbacks first (before useMemo)
  const handleNodeExpand = useCallback((nodeId: string) => {
    setLineageGraph(graph => expandNode(graph, nodeId, sampleLineageData));
  }, []);

  const handleNodeCollapse = useCallback((nodeId: string) => {
    setLineageGraph(graph => collapseNode(graph, nodeId));
  }, []);

  const handleExpandChildren = useCallback((nodeId: string) => {
    setLineageGraph(graph => expandChildren(graph, nodeId, sampleLineageData));
  }, []);

  const handleCollapseChildren = useCallback((nodeId: string) => {
    setLineageGraph(graph => collapseChildren(graph, nodeId));
  }, []);

  const handleToggleColumns = useCallback((nodeId: string) => {
    setLineageGraph(graph => toggleNodeColumns(graph, nodeId));
  }, []);

  const handleExpandAll = useCallback(() => {
    setLineageGraph(graph => expandAll(graph, sampleLineageData));
  }, []);

  const handleCollapseAll = useCallback(() => {
    setLineageGraph(graph => collapseAll(graph));
  }, []);

  const handleToggleDirection = useCallback(() => {
    setLayoutDirection(dir => dir === 'horizontal' ? 'vertical' : 'horizontal');
  }, []);

  // Convert lineage graph to React Flow nodes and edges
  const { nodes: reactFlowNodes, edges: reactFlowEdges } = useMemo(() => {
    // Add metadata to all nodes
    const nodesWithMetadata = new Map(lineageGraph.nodes);
    nodesWithMetadata.forEach((node, id) => {
      if (sampleTableMetadata[id]) {
        nodesWithMetadata.set(id, {
          ...node,
          metadata: sampleTableMetadata[id]
        });
      }
    });

    // Calculate layout
    const layoutNodes = calculateCenteredLayout(nodesWithMetadata, {
      direction: layoutDirection,
      nodeSpacing: 250,
      levelSpacing: 400
    });

    // Add callbacks to node data
    const nodesWithCallbacks: Node<TableNodeData>[] = layoutNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onExpand: handleNodeExpand,
        onCollapse: handleNodeCollapse,
        onExpandChildren: handleExpandChildren,
        onCollapseChildren: handleCollapseChildren,
        onToggleColumns: handleToggleColumns,
        layoutDirection
      }
    }));

    // Convert lineage edges to React Flow edges
    // Create column-level edges if columns are visible, otherwise table-level edges
    const edges: Edge[] = [];
    
    lineageGraph.edges.forEach(edge => {
      const sourceNode = lineageGraph.nodes.get(edge.source);
      const targetNode = lineageGraph.nodes.get(edge.target);
      
      // Check if both nodes have columns visible
      if (sourceNode?.showColumns && targetNode?.showColumns) {
        // Create column-to-column edges based on column lineage
        const columnLineages = sampleColumnLineages.filter(
          cl => cl.sourceTable === edge.source && cl.targetTable === edge.target
        );
        
        columnLineages.forEach(cl => {
          edges.push({
            id: `${edge.source}.${cl.sourceColumn}-${edge.target}.${cl.targetColumn}`,
            source: edge.source,
            target: edge.target,
            sourceHandle: `col-${cl.sourceColumn}`,
            targetHandle: `col-${cl.targetColumn}`,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#10b981', strokeWidth: 1.5 },
            label: cl.transformation !== 'DIRECT' ? '🔧' : undefined,
            labelStyle: { fontSize: 10 }
          });
        });
      } else {
        // Create table-level edge
        edges.push({
          id: `${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#0066ff', strokeWidth: 2 }
        });
      }
    });

    return {
      nodes: nodesWithCallbacks,
      edges
    };
  }, [lineageGraph, layoutDirection, handleNodeExpand, handleNodeCollapse, handleExpandChildren, handleCollapseChildren, handleToggleColumns]);

  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges);

  // Update nodes and edges when lineage graph changes
  useEffect(() => {
    setNodes(reactFlowNodes);
    setEdges(reactFlowEdges);
  }, [reactFlowNodes, reactFlowEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="app-container">
      <header className="header">
        <h1>📊 Data Lineage Viewer</h1>
        <div className="header-controls">
          <button className="btn" onClick={() => setShowFeatures(!showFeatures)}>
            {showFeatures ? 'Hide' : 'Show'} Info
          </button>
          <button className="btn" onClick={handleToggleDirection}>
            Layout: {layoutDirection === 'horizontal' ? 'Horizontal →' : 'Vertical ↓'}
          </button>
          <button className="btn" onClick={handleExpandAll}>
            Expand All
          </button>
          <button className="btn" onClick={handleCollapseAll}>
            Collapse All
          </button>
        </div>
      </header>

      <div className="flow-container">
        {showFeatures && (
          <>
            <div className="feature-badge pro">
              ⭐ Data Lineage Features
            </div>
            <div className="feature-list">
              <h3>Features Active</h3>
              <ul>
                <li>Expand/Collapse Lineage</li>
                <li>Column-Level Tracking</li>
                <li>Table Metadata Display</li>
                <li>Flexible Layout (H/V)</li>
                <li>Stakeholder Info</li>
              </ul>
              <h3 style={{ marginTop: '1rem' }}>How to Use</h3>
              <ul style={{ fontSize: '11px', color: '#aaa' }}>
                <li>Click + on tables to expand parents</li>
                <li>Click "Columns" to see details</li>
                <li>Use "Expand All" for full lineage</li>
              </ul>
            </div>
          </>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const tableNode = lineageGraph.nodes.get(node.id);
              if (tableNode?.isExpanded) return '#0066ff';
              if (tableNode?.hasParents) return '#2a2a2a';
              return '#444';
            }}
          />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}

export default App;
