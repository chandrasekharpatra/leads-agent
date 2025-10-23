-- Migration number: 0003 	 2025-10-22T15:47:01.571Z
DROP TABLE IF EXISTS companies;

DROP INDEX IF EXISTS idx_companies_company_id;

CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    company_id VARCHAR(255) NOT NULL,
    data BLOB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_companies_company_id ON companies (company_id);
