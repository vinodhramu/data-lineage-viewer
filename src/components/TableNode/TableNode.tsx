import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { TableNode } from '../../types/lineage';
import './TableNode.css';

export type TableNodeData = {
  node: TableNode;
  onExpand?: (nodeId: string) => void;
  onCollapse?: (nodeId: string) => void;
  onExpandChildren?: (nodeId: string) => void;
  onCollapseChildren?: (nodeId: string) => void;
  onToggleColumns?: (nodeId: string) => void;
  layoutDirection?: 'horizontal' | 'vertical';
};

function TableNodeComponent({ data }: NodeProps<TableNodeData>) {
  const { node, onExpand, onCollapse, onExpandChildren, onCollapseChildren, onToggleColumns, layoutDirection = 'horizontal' } = data;
  const { metadata, hasParents, hasChildren, isExpanded, isChildrenExpanded, showColumns, expandedBy, childrenExpandedBy } = node;

  const targetPosition = layoutDirection === 'horizontal' ? Position.Left : Position.Top;
  const sourcePosition = layoutDirection === 'horizontal' ? Position.Right : Position.Bottom;
  
  // Only show collapse button if THIS node triggered the expansion
  const canCollapseParents = isExpanded && expandedBy === node.id;
  const canCollapseChildren = isChildrenExpanded && childrenExpandedBy === node.id;
  
  // Nodes expanded as parents (via left button) should only show left expansion
  const isParentNode = expandedBy !== undefined && expandedBy !== node.id;
  // Nodes expanded as children (via right button) should only show right expansion
  const isChildNode = childrenExpandedBy !== undefined && childrenExpandedBy !== node.id;
  
  // Show left button if: not a child node AND (has parents OR can collapse parents)
  const showLeftButton = !isChildNode && (hasParents || canCollapseParents);
  // Show right button if: not a parent node AND (has children OR can collapse children)
  const showRightButton = !isParentNode && (hasChildren || canCollapseChildren);

  const handleExpandClick = () => {
    if (isExpanded) {
      onCollapse?.(node.id);
    } else {
      onExpand?.(node.id);
    }
  };

  const handleChildrenExpandClick = () => {
    if (isChildrenExpanded) {
      onCollapseChildren?.(node.id);
    } else {
      onExpandChildren?.(node.id);
    }
  };

  const handleColumnToggle = () => {
    onToggleColumns?.(node.id);
  };

  // Button icons based on layout direction
  const parentExpandIcon = layoutDirection === 'horizontal' ? '◄' : '▲';
  const childExpandIcon = layoutDirection === 'horizontal' ? '►' : '▼';

  return (
    <div className={`table-node ${isExpanded ? 'expanded' : ''} ${!hasParents && !hasChildren ? 'leaf' : ''}`}>
      {/* Input handle (for incoming edges from parents) */}
      <Handle
        type="target"
        position={targetPosition}
        className="table-handle table-handle-target"
      />

      {/* Table Header */}
      <div className="table-node-header">
        <div className="table-node-controls">
          {showLeftButton && !isExpanded && (
            <button
              className="expand-btn expand-left"
              onClick={handleExpandClick}
              title={layoutDirection === 'horizontal' ? "Expand parents (sources)" : "Expand parents (upstream)"}
            >
              {parentExpandIcon}
            </button>
          )}
          {showLeftButton && canCollapseParents && (
            <button
              className="expand-btn expand-left expanded"
              onClick={handleExpandClick}
              title={layoutDirection === 'horizontal' ? "Collapse parents (sources)" : "Collapse parents (upstream)"}
            >
              {parentExpandIcon}
            </button>
          )}
        </div>
        
        <div className="table-node-title">
          <span className="table-icon">📊</span>
          <span className="table-name">{node.label}</span>
          {metadata?.tableType && (
            <span className="table-type-badge">{metadata.tableType}</span>
          )}
        </div>
        
        <div className="table-node-controls">
          {showRightButton && !isChildrenExpanded && (
            <button
              className="expand-btn expand-right"
              onClick={handleChildrenExpandClick}
              title={layoutDirection === 'horizontal' ? "Expand children (consumers)" : "Expand children (downstream)"}
            >
              {childExpandIcon}
            </button>
          )}
          {showRightButton && canCollapseChildren && (
            <button
              className="expand-btn expand-right expanded"
              onClick={handleChildrenExpandClick}
              title={layoutDirection === 'horizontal' ? "Collapse children (consumers)" : "Collapse children (downstream)"}
            >
              {childExpandIcon}
            </button>
          )}
        </div>
      </div>

      {/* Table Metadata (optional) */}
      {metadata && (
        <div className="table-node-meta">
          {metadata.schema && (
            <div className="meta-item">
              <span className="meta-label">Schema:</span>
              <span className="meta-value">{metadata.schema}</span>
            </div>
          )}
          {metadata.rowCount !== undefined && (
            <div className="meta-item">
              <span className="meta-label">Rows:</span>
              <span className="meta-value">{metadata.rowCount.toLocaleString()}</span>
            </div>
          )}
          {metadata.description && (
            <div className="meta-item description">
              <span className="meta-value">{metadata.description}</span>
            </div>
          )}
          {metadata.stakeholders && metadata.stakeholders.length > 0 && (
            <div className="meta-item">
              <span className="meta-label">Owners:</span>
              <span className="meta-value">{metadata.stakeholders.join(', ')}</span>
            </div>
          )}
          {metadata.tags && metadata.tags.length > 0 && (
            <div className="meta-tags">
              {metadata.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Column List (expandable) - Only in horizontal layout */}
      {metadata?.columns && metadata.columns.length > 0 && layoutDirection === 'horizontal' && (
        <>
          <div className="table-node-columns-toggle" onClick={handleColumnToggle}>
            <span className="toggle-icon">{showColumns ? '▼' : '▶'}</span>
            <span>Columns ({metadata.columns.length})</span>
          </div>
          
          {showColumns && (
            <div className="table-node-columns">
              {metadata.columns.map((column, idx) => (
                <div key={column.name} className="column-item">
                  {/* Target handle for incoming column edges (left side) */}
                  <Handle
                    type="target"
                    position={targetPosition}
                    id={`col-${column.name}`}
                    className="column-handle column-handle-target"
                    style={{
                      top: layoutDirection === 'horizontal' ? `${((idx + 1) / (metadata.columns!.length + 1)) * 100}%` : undefined,
                      left: layoutDirection === 'vertical' ? `${((idx + 1) / (metadata.columns!.length + 1)) * 100}%` : undefined,
                    }}
                  />
                  {/* Source handle for outgoing column edges (right side) */}
                  <Handle
                    type="source"
                    position={sourcePosition}
                    id={`col-${column.name}`}
                    className="column-handle column-handle-source"
                    style={{
                      top: layoutDirection === 'horizontal' ? `${((idx + 1) / (metadata.columns!.length + 1)) * 100}%` : undefined,
                      left: layoutDirection === 'vertical' ? `${((idx + 1) / (metadata.columns!.length + 1)) * 100}%` : undefined,
                    }}
                  />
                  <span className="column-icon">
                    {column.isPrimaryKey ? '🔑' : column.isForeignKey ? '🔗' : '•'}
                  </span>
                  <span className="column-name">{column.name}</span>
                  {column.dataType && (
                    <span className="column-type">{column.dataType}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Output handle (for outgoing edges to children) */}
      <Handle
        type="source"
        position={sourcePosition}
        className="table-handle table-handle-source"
      />
    </div>
  );
}

export const TableNodeMemo = memo(TableNodeComponent);
