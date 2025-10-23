import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { inject, singleton } from 'tsyringe-neo';
import { task_d1_schema } from '../drizzle/task_schema';
import { Task } from './stored/stored_task';

interface TaskStore {
	createTask(task: Task): Promise<void>;
	getTaskById(taskId: string): Promise<Task | null>;
	updateTask(task: Task): Promise<void>;
	deleteTask(taskId: string): Promise<void>;
}

@singleton()
class D1TaskStore implements TaskStore {
	constructor(@inject('DB') private db: D1Database) {}

	async createTask(task: Task): Promise<void> {
		const db = drizzle(this.db);
		const date = new Date();
		await db
			.insert(task_d1_schema)
			.values({
				task_id: task.taskId,
				data: JSON.stringify(task.data),
				created_at: date,
				updated_at: date,
			})
			.execute();
	}

	async getTaskById(taskId: string): Promise<Task | null> {
		const db = drizzle(this.db);
		const results = await db.select().from(task_d1_schema).where(eq(task_d1_schema.task_id, taskId)).execute();
		if (results.length === 0) {
			return null;
		}
		const result = results[0];
		return {
			taskId: result.task_id,
			data: JSON.parse(result.data as string),
			createdAt: result.created_at ? new Date(result.created_at).getTime() : 0,
			updatedAt: result.updated_at ? new Date(result.updated_at).getTime() : 0,
		};
	}

	async updateTask(task: Task): Promise<void> {
		const db = drizzle(this.db);
		const date = new Date();
		await db
			.update(task_d1_schema)
			.set({
				data: JSON.stringify(task.data),
				updated_at: date,
			})
			.where(eq(task_d1_schema.task_id, task.taskId))
			.execute();
	}

	async deleteTask(taskId: string): Promise<void> {
		const db = drizzle(this.db);
		await db.delete(task_d1_schema).where(eq(task_d1_schema.task_id, taskId)).execute();
	}
}

export { type TaskStore, D1TaskStore };
