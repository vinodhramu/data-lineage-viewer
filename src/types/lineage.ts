// Data structure types for table lineage with column-level support

/**
 * Column-level lineage mapping
 */
export type ColumnLineage = {
  targetTable: string;
  targetColumn: string;
  sourceTable: string;
  sourceColumn: string;
  transformation?: string;  // SQL expression or transformation logic
};

/**
 * Column definition
 */
export type ColumnInfo = {
  name: string;
  dataType?: string;
  description?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isNullable?: boolean;
};

/**
 * Raw lineage edge from database (table-level)
 */
export type LineageEdge = {
  target: string;  // downstream table
  source: string;  // upstream table (parent)
  metadata?: {
    joinType?: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'UNION' | 'CROSS';
    transformationType?: string;
  };
};

/**
 * Table metadata (optional)
 */
export type TableMetadata = {
  schema?: string;
  database?: string;
  rowCount?: number;
  lastUpdated?: string;
  tableType?: 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'EXTERNAL';
  description?: string;
  owner?: string;
  stakeholders?: string[];  // Team members responsible
  tags?: string[];  // Classification tags
  columns?: ColumnInfo[];   // Column definitions
};

/**
 * Internal representation of a table node
 */
export type TableNode = {
  id: string;              // unique table identifier
  label: string;           // display name
  type: 'table';
  hasParents: boolean;     // has upstream source tables
  hasChildren: boolean;    // has downstream consumer tables
  isExpanded: boolean;     // showing parent nodes
  isChildrenExpanded: boolean;  // showing child nodes
  expandedBy?: string;     // ID of the node that triggered parent expansion
  childrenExpandedBy?: string;  // ID of the node that triggered children expansion
  showColumns: boolean;    // display columns in node
  level: number;           // depth in lineage tree (0 = target)
  parentIds: string[];     // list of direct parent table IDs
  childIds: string[];      // list of direct child table IDs
  metadata?: TableMetadata;
};

/**
 * Lineage graph state
 */
export type LineageGraph = {
  nodes: Map<string, TableNode>;
  edges: LineageEdge[];
  columnLineages: ColumnLineage[];  // column-level mappings
  rootTableId: string;  // starting point (final table)
};

/**
 * Layout direction
 */
export type LayoutDirection = 'horizontal' | 'vertical';

/**
 * Layout configuration
 */
export type LayoutConfig = {
  direction: LayoutDirection;
  nodeSpacing: number;     // horizontal space between nodes
  levelSpacing: number;    // vertical space between levels
  columnSpacing: number;   // space between columns in a node
};
