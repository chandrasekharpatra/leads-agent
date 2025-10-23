-- Migration number: 0001 	 2025-10-22T15:39:12.168Z

DROP TABLE IF EXISTS techparks;

DROP INDEX IF EXISTS idx_techparks_techpark;

CREATE TABLE techparks (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    techpark_id VARCHAR(255) NOT NULL,
    data BLOB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_techparks_techpark ON techparks (techpark_id);
