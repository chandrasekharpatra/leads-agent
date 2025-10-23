-- Migration number: 0004 	 2025-10-22T15:48:22.132Z
DROP TABLE IF EXISTS techpark_company_mappings;
DROP INDEX IF EXISTS idx_techpark_company_mappings_techpark_company;

CREATE TABLE techpark_company_mappings(
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    techpark_id VARCHAR(255) NOT NULL,
    company_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_techpark_company_mappings_techpark_company ON techpark_company_mappings (techpark_id, company_id);
