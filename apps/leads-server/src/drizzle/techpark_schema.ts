import { sql } from 'drizzle-orm';
import { int, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const techpark_d1_schema = sqliteTable(
	'techparks',
	{
		id: int({ mode: 'number' }).primaryKey({ autoIncrement: true }),
		techpark_id: text({ length: 255 }).notNull(),
		data: text({ mode: 'json' }),
		created_at: int({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
		updated_at: int({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [primaryKey({ columns: [table.id] }), unique('idx_techpark_techpark_id').on(table.techpark_id)],
);

export const techpark_company_mapping_d1_schema = sqliteTable(
	'techpark_company_mappings',
	{
		id: int({ mode: 'number' }).primaryKey({ autoIncrement: true }),
		techpark_id: text({ length: 255 }).notNull(),
		company_id: text({ length: 255 }).notNull(),
		created_at: int({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
		updated_at: int({ mode: 'timestamp_ms' })
			.default(sql`(CURRENT_TIMESTAMP)`)
			.$onUpdateFn(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		primaryKey({ columns: [table.id] }),
		unique('idx_techpark_company_mappings_techpark_company').on(table.techpark_id, table.company_id),
	],
);
