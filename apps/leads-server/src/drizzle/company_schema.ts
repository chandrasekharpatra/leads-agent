import { sql } from 'drizzle-orm';
import { int, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const company_d1_schema = sqliteTable(
	'companies',
	{
		id: int({ mode: 'number' }).primaryKey({ autoIncrement: true }),
		company_id: text({ length: 255 }).notNull(),
		data: text({ mode: 'json' }),
		created_at: int({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
		updated_at: int({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [primaryKey({ columns: [table.id] }), unique('idx_company_company_id').on(table.company_id)],
);
