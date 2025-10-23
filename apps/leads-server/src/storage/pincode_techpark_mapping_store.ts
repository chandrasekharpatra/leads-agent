import { and, desc, eq, gt, lt } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { inject, singleton } from 'tsyringe-neo';
import { pincode_techpark_mapping_d1_schema } from '../drizzle/pincode_schema';
import { PaginatedResponse, SyncRequest } from '../models/io';
import { PincodeTechparkMapping } from './stored/stored_pincode';

interface PincodeTechparkMappingStore {
	createMapping(mapping: PincodeTechparkMapping): Promise<void>;
	deleteMapping(pincode: string, techparkId: string): Promise<void>;
	sync(pincode: string, request: SyncRequest): Promise<PaginatedResponse<PincodeTechparkMapping>>;
	getMapping(pincode: string, techparkId: string): Promise<PincodeTechparkMapping | null>;
	ensureMapping(pincode: string, techparkId: string): Promise<void>;
}

@singleton()
class D1PincodeTechparkMappingStore implements PincodeTechparkMappingStore {
	constructor(@inject('DB') private db: D1Database) {}

	async createMapping(mapping: PincodeTechparkMapping): Promise<void> {
		const db = drizzle(this.db);
		const date = new Date();
		await db
			.insert(pincode_techpark_mapping_d1_schema)
			.values({
				techpark_id: mapping.techparkId,
				pincode_id: mapping.pincodeId,
				created_at: date,
				updated_at: date,
			})
			.execute();
	}

	async deleteMapping(pincode: string, techparkId: string): Promise<void> {
		const db = drizzle(this.db);
		await db
			.delete(pincode_techpark_mapping_d1_schema)
			.where(
				and(eq(pincode_techpark_mapping_d1_schema.pincode_id, pincode), eq(pincode_techpark_mapping_d1_schema.techpark_id, techparkId)),
			)
			.execute();
	}

	async sync(
		pincode: string,
		{ pointer: incomingPointer, direction, limit }: SyncRequest,
	): Promise<PaginatedResponse<PincodeTechparkMapping>> {
		const db = drizzle(this.db);
		let pointer: CompositePointer;
		if (!incomingPointer) {
			pointer = {
				latest: undefined,
				earliest: undefined,
			};
		} else {
			pointer = JSON.parse(atob(incomingPointer)) as CompositePointer;
		}

		if (!pointer.earliest && !pointer.latest) {
			// Initial sync, fetch latest records
			const results = await db
				.select()
				.from(pincode_techpark_mapping_d1_schema)
				.where(and(eq(pincode_techpark_mapping_d1_schema.pincode_id, pincode)))
				.limit(limit)
				.orderBy(desc(pincode_techpark_mapping_d1_schema.id))
				.execute();
			const mappings = results.map((result) => ({
				techparkId: result.techpark_id,
				pincodeId: result.pincode_id,
				createdAt: result.created_at ? result.created_at.getTime() : 0,
				updatedAt: result.updated_at ? result.updated_at.getTime() : 0,
			}));
			let nextPointer: CompositePointer | undefined = undefined;
			if (mappings.length > 0) {
				const latest = results[0];
				const latestCursor: Cursor = {
					id: latest.id,
				};
				const earliest = results[results.length - 1];
				const earliestCursor: Cursor = {
					id: earliest.id,
				};
				nextPointer = {
					latest: btoa(JSON.stringify(latestCursor)),
					earliest: btoa(JSON.stringify(earliestCursor)),
				};
			}
			return {
				data: mappings,
				total: mappings.length,
				cursor: nextPointer ? btoa(JSON.stringify(nextPointer)) : incomingPointer,
			};
		} else if (direction === 'FORWARD' && pointer.latest) {
			const cursor: Cursor = JSON.parse(atob(pointer.latest));
			const results = await db
				.select()
				.from(pincode_techpark_mapping_d1_schema)
				.where(and(eq(pincode_techpark_mapping_d1_schema.pincode_id, pincode), gt(pincode_techpark_mapping_d1_schema.id, cursor.id)))
				.limit(limit)
				.orderBy(desc(pincode_techpark_mapping_d1_schema.id))
				.execute();
			const mappings = results.map((result) => ({
				techparkId: result.techpark_id,
				pincodeId: result.pincode_id,
				createdAt: result.created_at ? result.created_at.getTime() : 0,
				updatedAt: result.updated_at ? result.updated_at.getTime() : 0,
			}));
			let nextPointer: CompositePointer | undefined = undefined;
			if (mappings.length > 0) {
				const result = results[0];
				const newCursor: Cursor = {
					id: result.id,
				};
				nextPointer = {
					latest: btoa(JSON.stringify(newCursor)),
					earliest: pointer.earliest ? pointer.earliest : undefined,
				};
			}
			return {
				data: mappings,
				total: mappings.length,
				cursor: nextPointer ? btoa(JSON.stringify(nextPointer)) : incomingPointer,
			};
		} else if (direction === 'BACKWARD' && pointer.earliest) {
			const cursor: Cursor = JSON.parse(atob(pointer.earliest));
			const results = await db
				.select()
				.from(pincode_techpark_mapping_d1_schema)
				.where(and(eq(pincode_techpark_mapping_d1_schema.pincode_id, pincode), lt(pincode_techpark_mapping_d1_schema.id, cursor.id)))
				.limit(limit)
				.orderBy(desc(pincode_techpark_mapping_d1_schema.id))
				.execute();
			const mappings = results.map((result) => ({
				techparkId: result.techpark_id,
				pincodeId: result.pincode_id,
				createdAt: result.created_at ? result.created_at.getTime() : 0,
				updatedAt: result.updated_at ? result.updated_at.getTime() : 0,
			}));
			let nextPointer: CompositePointer | undefined = undefined;
			if (mappings.length > 0) {
				const result = results[results.length - 1];
				const newCursor: Cursor = {
					id: result.id,
				};
				nextPointer = {
					earliest: btoa(JSON.stringify(newCursor)),
					latest: pointer.latest ? pointer.latest : undefined,
				};
			}
			return {
				data: mappings,
				total: mappings.length,
				cursor: nextPointer ? btoa(JSON.stringify(nextPointer)) : incomingPointer,
			};
		}
		throw new Error('Invalid pointer or direction');
	}

	async getMapping(pincode: string, techparkId: string): Promise<PincodeTechparkMapping | null> {
		const db = drizzle(this.db);
		const results = await db
			.select()
			.from(pincode_techpark_mapping_d1_schema)
			.where(
				and(eq(pincode_techpark_mapping_d1_schema.pincode_id, pincode), eq(pincode_techpark_mapping_d1_schema.techpark_id, techparkId)),
			)
			.execute();
		if (results.length === 0) {
			return null;
		}
		const result = results[0];
		return {
			techparkId: result.techpark_id,
			pincodeId: result.pincode_id,
			createdAt: result.created_at ? result.created_at.getTime() : 0,
			updatedAt: result.updated_at ? result.updated_at.getTime() : 0,
		};
	}

	async ensureMapping(pincode: string, techparkId: string): Promise<void> {
		const db = drizzle(this.db);
		const existingMapping = await db
			.select()
			.from(pincode_techpark_mapping_d1_schema)
			.where(
				and(eq(pincode_techpark_mapping_d1_schema.pincode_id, pincode), eq(pincode_techpark_mapping_d1_schema.techpark_id, techparkId)),
			)
			.execute();
		if (existingMapping.length > 0) {
			return;
		}
		await this.createMapping({
			techparkId,
			pincodeId: pincode,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	}
}

interface CompositePointer {
	latest?: string;
	earliest?: string;
}

interface Cursor {
	id: number;
}

export { D1PincodeTechparkMappingStore, type PincodeTechparkMappingStore };
