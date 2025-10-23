-- Migration number: 0007 	 2025-10-22T17:05:09.166Z
DROP TABLE IF EXISTS workflow_task_mappings;
DROP INDEX IF EXISTS idx_workflow_task_mappings_workflow_task;

CREATE TABLE workflow_task_mappings(
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    workflow_id VARCHAR(255) NOT NULL,
    task_id VARCHAR(255) NOT NULL,
    state VARCHAR(100) DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflow_task_mappings_workflow_task ON workflow_task_mappings (workflow_id, task_id);
