import { sql } from 'drizzle-orm';
import { int, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const user_workflow_mapping_d1_schema = sqliteTable(
	'user_workflow_mappings',
	{
		id: int({ mode: 'number' }).primaryKey({ autoIncrement: true }),
		user_id: text({ length: 255 }).notNull(),
		workflow_id: text({ length: 255 }).notNull(),
		created_at: int({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
		updated_at: int({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [primaryKey({ columns: [table.id] }), unique('idx_user_workflow_mapping_user_workflow').on(table.user_id, table.workflow_id)],
);
