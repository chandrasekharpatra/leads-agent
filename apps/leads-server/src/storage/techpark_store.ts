import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { inject, singleton } from 'tsyringe-neo';
import { techpark_d1_schema } from '../drizzle/techpark_schema';
import { Techpark } from './stored/stored_techpark';

interface TechParkStore {
	createTechPark(park: Techpark): Promise<void>;
	getTechParkById(techparkId: string): Promise<Techpark | null>;
	updateTechPark(park: Techpark): Promise<void>;
	deleteTechPark(techparkId: string): Promise<void>;
}

@singleton()
class D1TechParkStore implements TechParkStore {
	constructor(@inject('DB') private db: D1Database) {}

	async createTechPark(park: Techpark): Promise<void> {
		const db = drizzle(this.db);
		const date = new Date();
		await db
			.insert(techpark_d1_schema)
			.values({
				techpark_id: park.techparkId,
				data: JSON.stringify(park.data),
				created_at: date,
				updated_at: date,
			})
			.execute();
	}

	async getTechParkById(techparkId: string): Promise<Techpark | null> {
		const db = drizzle(this.db);
		const results = await db.select().from(techpark_d1_schema).where(eq(techpark_d1_schema.techpark_id, techparkId)).execute();
		if (results.length === 0) {
			return null;
		}
		const result = results[0];
		return {
			techparkId: result.techpark_id,
			data: JSON.parse(result.data as string),
			createdAt: result.created_at ? new Date(result.created_at).getTime() : 0,
			updatedAt: result.updated_at ? new Date(result.updated_at).getTime() : 0,
		};
	}

	async updateTechPark(park: Techpark): Promise<void> {
		const db = drizzle(this.db);
		const date = new Date();
		await db
			.update(techpark_d1_schema)
			.set({
				data: JSON.stringify(park.data),
				updated_at: date,
			})
			.where(eq(techpark_d1_schema.techpark_id, park.techparkId))
			.execute();
	}

	async deleteTechPark(techparkId: string): Promise<void> {
		const db = drizzle(this.db);
		await db.delete(techpark_d1_schema).where(eq(techpark_d1_schema.techpark_id, techparkId)).execute();
	}
}

export { type TechParkStore, D1TechParkStore };
