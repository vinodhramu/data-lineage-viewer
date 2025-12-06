import type { LineageEdge, ColumnLineage, TableMetadata } from '../types/lineage';

/**
 * Sample table metadata with columns and stakeholders
 */
export const sampleTableMetadata: Record<string, TableMetadata> = {
  table_final: {
    schema: 'analytics',
    database: 'warehouse',
    tableType: 'TABLE',
    description: 'Final aggregated customer analytics table',
    owner: 'Analytics Team',
    stakeholders: ['John Doe', 'Jane Smith'],
    tags: ['production', 'dashboard', 'critical'],
    rowCount: 1250000,
    lastUpdated: '2025-12-06T10:30:00Z',
    columns: [
      { name: 'customer_id', dataType: 'INTEGER', isPrimaryKey: true, description: 'Unique customer identifier' },
      { name: 'full_name', dataType: 'VARCHAR(255)', description: 'Customer full name' },
      { name: 'total_orders', dataType: 'INTEGER', description: 'Total number of orders' },
      { name: 'total_revenue', dataType: 'DECIMAL(10,2)', description: 'Total revenue from customer' },
      { name: 'last_order_date', dataType: 'DATE', description: 'Date of last order' },
    ]
  },
  table_stage1: {
    schema: 'staging',
    database: 'warehouse',
    tableType: 'VIEW',
    description: 'Staging table combining customer and order data',
    owner: 'Data Engineering Team',
    stakeholders: ['Bob Johnson'],
    tags: ['staging', 'transformation'],
    columns: [
      { name: 'customer_id', dataType: 'INTEGER' },
      { name: 'first_name', dataType: 'VARCHAR(100)' },
      { name: 'last_name', dataType: 'VARCHAR(100)' },
      { name: 'order_count', dataType: 'INTEGER' },
      { name: 'revenue', dataType: 'DECIMAL(10,2)' },
      { name: 'latest_order', dataType: 'DATE' },
    ]
  },
  source_customers: {
    schema: 'raw',
    database: 'warehouse',
    tableType: 'TABLE',
    description: 'Raw customer master data from CRM',
    owner: 'Data Engineering Team',
    tags: ['source', 'crm'],
    columns: [
      { name: 'id', dataType: 'INTEGER', isPrimaryKey: true },
      { name: 'fname', dataType: 'VARCHAR(100)' },
      { name: 'lname', dataType: 'VARCHAR(100)' },
      { name: 'email', dataType: 'VARCHAR(255)' },
    ]
  },
  source_orders: {
    schema: 'raw',
    database: 'warehouse',
    tableType: 'TABLE',
    description: 'Raw order transactions from sales system',
    owner: 'Data Engineering Team',
    tags: ['source', 'sales'],
    columns: [
      { name: 'order_id', dataType: 'INTEGER', isPrimaryKey: true },
      { name: 'customer_id', dataType: 'INTEGER', isForeignKey: true },
      { name: 'order_date', dataType: 'DATE' },
      { name: 'amount', dataType: 'DECIMAL(10,2)' },
    ]
  }
};

/**
 * Column-level lineage mappings
 */
export const sampleColumnLineages: ColumnLineage[] = [
  // table_final columns from table_stage1
  { 
    targetTable: 'table_final', 
    targetColumn: 'customer_id', 
    sourceTable: 'table_stage1', 
    sourceColumn: 'customer_id',
    transformation: 'DIRECT'
  },
  { 
    targetTable: 'table_final', 
    targetColumn: 'full_name', 
    sourceTable: 'table_stage1', 
    sourceColumn: 'first_name',
    transformation: 'CONCAT(first_name, \' \', last_name)'
  },
  { 
    targetTable: 'table_final', 
    targetColumn: 'full_name', 
    sourceTable: 'table_stage1', 
    sourceColumn: 'last_name',
    transformation: 'CONCAT(first_name, \' \', last_name)'
  },
  { 
    targetTable: 'table_final', 
    targetColumn: 'total_orders', 
    sourceTable: 'table_stage1', 
    sourceColumn: 'order_count',
    transformation: 'DIRECT'
  },
  { 
    targetTable: 'table_final', 
    targetColumn: 'total_revenue', 
    sourceTable: 'table_stage1', 
    sourceColumn: 'revenue',
    transformation: 'DIRECT'
  },
  { 
    targetTable: 'table_final', 
    targetColumn: 'last_order_date', 
    sourceTable: 'table_stage1', 
    sourceColumn: 'latest_order',
    transformation: 'DIRECT'
  },
  
  // table_stage1 columns from sources
  { 
    targetTable: 'table_stage1', 
    targetColumn: 'customer_id', 
    sourceTable: 'source_customers', 
    sourceColumn: 'id',
    transformation: 'DIRECT'
  },
  { 
    targetTable: 'table_stage1', 
    targetColumn: 'first_name', 
    sourceTable: 'source_customers', 
    sourceColumn: 'fname',
    transformation: 'DIRECT'
  },
  { 
    targetTable: 'table_stage1', 
    targetColumn: 'last_name', 
    sourceTable: 'source_customers', 
    sourceColumn: 'lname',
    transformation: 'DIRECT'
  },
  { 
    targetTable: 'table_stage1', 
    targetColumn: 'order_count', 
    sourceTable: 'source_orders', 
    sourceColumn: 'order_id',
    transformation: 'COUNT(order_id)'
  },
  { 
    targetTable: 'table_stage1', 
    targetColumn: 'revenue', 
    sourceTable: 'source_orders', 
    sourceColumn: 'amount',
    transformation: 'SUM(amount)'
  },
  { 
    targetTable: 'table_stage1', 
    targetColumn: 'latest_order', 
    sourceTable: 'source_orders', 
    sourceColumn: 'order_date',
    transformation: 'MAX(order_date)'
  },
];

/**
 * Sample lineage data representing a typical data warehouse flow
 * 
 * Lineage structure:
 * table_final (Level 0)
 *   ├── table_stage1 (Level 1)
 *   │   ├── source_customers (Level 2)
 *   │   │   └── raw_crm_data (Level 3)
 *   │   └── source_orders (Level 2)
 *   │       └── raw_sales_data (Level 3)
 *   └── table_stage2 (Level 1)
 *       ├── source_products (Level 2)
 *       │   └── raw_inventory_data (Level 3)
 *       └── source_pricing (Level 2)
 *           └── raw_pricing_feed (Level 3)
 */
export const sampleLineageData: LineageEdge[] = [
  // table_final dependencies (upstream sources)
  { target: 'table_final', source: 'table_stage1' },
  { target: 'table_final', source: 'table_stage2' },
  
  // table_final consumers (downstream)
  { target: 'analytics_dashboard', source: 'table_final' },
  { target: 'ml_model_training', source: 'table_final' },
  
  // analytics_dashboard consumers
  { target: 'executive_report', source: 'analytics_dashboard' },
  { target: 'sales_kpi_dashboard', source: 'analytics_dashboard' },
  
  // ml_model_training consumers
  { target: 'customer_churn_model', source: 'ml_model_training' },
  { target: 'recommendation_engine', source: 'ml_model_training' },
  
  // table_stage1 dependencies
  { target: 'table_stage1', source: 'source_customers' },
  { target: 'table_stage1', source: 'source_orders' },
  
  // table_stage2 dependencies
  { target: 'table_stage2', source: 'source_products' },
  { target: 'table_stage2', source: 'source_pricing' },
  
  // source_customers dependencies
  { target: 'source_customers', source: 'raw_crm_data' },
  
  // source_orders dependencies
  { target: 'source_orders', source: 'raw_sales_data' },
  
  // source_products dependencies
  { target: 'source_products', source: 'raw_inventory_data' },
  
  // source_pricing dependencies
  { target: 'source_pricing', source: 'raw_pricing_feed' },
];

/**
 * Complex lineage example with shared dependencies
 */
export const complexLineageData: LineageEdge[] = [
  { target: 'analytics_dashboard', source: 'fact_sales' },
  { target: 'analytics_dashboard', source: 'fact_inventory' },
  { target: 'analytics_dashboard', source: 'dim_customer' },
  
  { target: 'fact_sales', source: 'stg_orders' },
  { target: 'fact_sales', source: 'stg_order_items' },
  { target: 'fact_sales', source: 'dim_customer' }, // Shared dependency
  
  { target: 'fact_inventory', source: 'stg_inventory' },
  { target: 'fact_inventory', source: 'stg_products' },
  
  { target: 'dim_customer', source: 'stg_customers' },
  { target: 'dim_customer', source: 'stg_addresses' },
  
  { target: 'stg_orders', source: 'raw_orders' },
  { target: 'stg_order_items', source: 'raw_order_items' },
  { target: 'stg_inventory', source: 'raw_inventory_snapshot' },
  { target: 'stg_products', source: 'raw_product_catalog' },
  { target: 'stg_customers', source: 'raw_customer_master' },
  { target: 'stg_addresses', source: 'raw_address_data' },
];
