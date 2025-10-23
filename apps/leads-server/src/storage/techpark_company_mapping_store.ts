import { and, desc, eq, gt, lt } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { inject, singleton } from 'tsyringe-neo';
import { techpark_company_mapping_d1_schema } from '../drizzle/techpark_schema';
import { PaginatedResponse, SyncRequest } from '../models/io';
import { TechparkCompanyMapping } from './stored/stored_techpark';

interface TechparkCompanyMappingStore {
	createMapping(mapping: TechparkCompanyMapping): Promise<void>;
	deleteMapping(techparkId: string, companyId: string): Promise<void>;
	sync(techparkId: string, request: SyncRequest): Promise<PaginatedResponse<TechparkCompanyMapping>>;
	getMapping(techparkId: string, companyId: string): Promise<TechparkCompanyMapping | null>;
	ensureMapping(techparkId: string, companyId: string): Promise<void>;
}

@singleton()
class D1TechparkCompanyMappingStore implements TechparkCompanyMappingStore {
	constructor(@inject('DB') private db: D1Database) {}

	async createMapping(mapping: TechparkCompanyMapping): Promise<void> {
		const db = drizzle(this.db);
		const date = new Date();
		await db
			.insert(techpark_company_mapping_d1_schema)
			.values({
				techpark_id: mapping.techparkId,
				company_id: mapping.companyId,
				created_at: date,
				updated_at: date,
			})
			.execute();
	}

	async deleteMapping(techparkId: string, companyId: string): Promise<void> {
		const db = drizzle(this.db);
		await db
			.delete(techpark_company_mapping_d1_schema)
			.where(
				and(eq(techpark_company_mapping_d1_schema.techpark_id, techparkId), eq(techpark_company_mapping_d1_schema.company_id, companyId)),
			)
			.execute();
	}

	async sync(
		techparkId: string,
		{ pointer: incomingPointer, direction, limit }: SyncRequest,
	): Promise<PaginatedResponse<TechparkCompanyMapping>> {
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
				.from(techpark_company_mapping_d1_schema)
				.where(and(eq(techpark_company_mapping_d1_schema.techpark_id, techparkId)))
				.limit(limit)
				.orderBy(desc(techpark_company_mapping_d1_schema.id))
				.execute();
			const mappings = results.map((result) => ({
				techparkId: result.techpark_id,
				companyId: result.company_id,
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
				.from(techpark_company_mapping_d1_schema)
				.where(and(eq(techpark_company_mapping_d1_schema.techpark_id, techparkId), gt(techpark_company_mapping_d1_schema.id, cursor.id)))
				.limit(limit)
				.orderBy(desc(techpark_company_mapping_d1_schema.id))
				.execute();
			const mappings = results.map((result) => ({
				techparkId: result.techpark_id,
				companyId: result.company_id,
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
				.from(techpark_company_mapping_d1_schema)
				.where(and(eq(techpark_company_mapping_d1_schema.techpark_id, techparkId), lt(techpark_company_mapping_d1_schema.id, cursor.id)))
				.limit(limit)
				.orderBy(desc(techpark_company_mapping_d1_schema.id))
				.execute();
			const mappings = results.map((result) => ({
				techparkId: result.techpark_id,
				companyId: result.company_id,
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

	async getMapping(techparkId: string, companyId: string): Promise<TechparkCompanyMapping | null> {
		const db = drizzle(this.db);
		const results = await db
			.select()
			.from(techpark_company_mapping_d1_schema)
			.where(
				and(eq(techpark_company_mapping_d1_schema.techpark_id, techparkId), eq(techpark_company_mapping_d1_schema.company_id, companyId)),
			)
			.execute();
		if (results.length === 0) {
			return null;
		}
		const result = results[0];
		return {
			techparkId: result.techpark_id,
			companyId: result.company_id,
			createdAt: result.created_at ? result.created_at.getTime() : 0,
			updatedAt: result.updated_at ? result.updated_at.getTime() : 0,
		};
	}

	async ensureMapping(techparkId: string, companyId: string): Promise<void> {
		const db = drizzle(this.db);
		const existingMapping = await db
			.select()
			.from(techpark_company_mapping_d1_schema)
			.where(
				and(eq(techpark_company_mapping_d1_schema.techpark_id, techparkId), eq(techpark_company_mapping_d1_schema.company_id, companyId)),
			)
			.execute();
		if (existingMapping.length > 0) {
			return;
		}
		await this.createMapping({
			techparkId,
			companyId,
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

export { D1TechparkCompanyMappingStore, type TechparkCompanyMappingStore };
