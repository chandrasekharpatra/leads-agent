import { sql } from 'drizzle-orm';
import { int, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const pincode_techpark_mapping_d1_schema = sqliteTable(
	'pincode_techpark_mappings',
	{
		id: int({ mode: 'number' }).primaryKey({ autoIncrement: true }),
		pincode_id: text({ length: 255 }).notNull(),
		techpark_id: text({ length: 255 }).notNull(),
		created_at: int({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
		updated_at: int({ mode: 'timestamp_ms' })
			.default(sql`(CURRENT_TIMESTAMP)`)
			.$onUpdateFn(() => sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		primaryKey({ columns: [table.id] }),
		unique('idx_pincode_techpark_mappings_pincode_techpark').on(table.pincode_id, table.techpark_id),
	],
);
