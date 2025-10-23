import { sql } from 'drizzle-orm';
import { int, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const task_d1_schema = sqliteTable(
	'tasks',
	{
		id: int({ mode: 'number' }).primaryKey({ autoIncrement: true }),
		task_id: text({ length: 255 }).notNull(),
		data: text({ mode: 'json' }),
		created_at: int({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
		updated_at: int({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [primaryKey({ columns: [table.id] }), unique('idx_task_task_id').on(table.task_id)],
);
