import { sql } from 'drizzle-orm';
import { int, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const workflow_d1_schema = sqliteTable(
	'workflows',
	{
		id: int({ mode: 'number' }).primaryKey({ autoIncrement: true }),
		workflow_id: text({ length: 255 }).notNull(),
		data: text({ mode: 'json' }),
		created_at: int({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
		updated_at: int({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [primaryKey({ columns: [table.id] }), unique('idx_workflow_workflow_id').on(table.workflow_id)],
);

export const workflow_task_mapping_d1_schema = sqliteTable(
	'workflow_task_mappings',
	{
		id: int({ mode: 'number' }).primaryKey({ autoIncrement: true }),
		workflow_id: text({ length: 255 }).notNull(),
		task_id: text({ length: 255 }).notNull(),
		state: text({ length: 50 }).notNull(),
		created_at: int({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
		updated_at: int({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [primaryKey({ columns: [table.id] }), unique('idx_workflow_task_mapping_workflow_task').on(table.workflow_id, table.task_id)],
);
