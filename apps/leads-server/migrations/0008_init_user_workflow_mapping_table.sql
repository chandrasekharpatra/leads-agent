-- Migration number: 0008 	 2025-10-22T17:14:21.819Z
DROP TABLE IF EXISTS user_workflow_mappings;
DROP INDEX IF EXISTS idx_user_workflow_mappings_user_workflow;

CREATE TABLE user_workflow_mappings(
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    workflow_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_workflow_mappings_user_workflow ON user_workflow_mappings (user_id, workflow_id);
