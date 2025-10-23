-- Migration number: 0002 	 2025-10-22T15:44:50.213Z
DROP TABLE IF EXISTS pincode_techpark_mappings;
DROP INDEX IF EXISTS idx_pincode_techpark_mappings_pincode_techpark;

CREATE TABLE pincode_techpark_mappings(
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    pincode_id VARCHAR(255) NOT NULL,
    techpark_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pincode_techpark_mappings_pincode_techpark ON pincode_techpark_mappings (pincode_id, techpark_id);
