-- Migration number: 0005 	 2025-10-22T17:04:34.652Z

DROP TABLE IF EXISTS workflows;

DROP INDEX IF EXISTS idx_workflows_workflow;

CREATE TABLE workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    workflow_id VARCHAR(255) NOT NULL,
    data BLOB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_workflows_workflow ON workflows (workflow_id);
