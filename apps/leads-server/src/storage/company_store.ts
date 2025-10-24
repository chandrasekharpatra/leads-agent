import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { inject, singleton } from 'tsyringe-neo';
import { company_d1_schema } from '../drizzle/company_schema';
import { Company } from './stored/stored_company';

interface CompanyStore {
	createCompany(company: Company): Promise<void>;
	getCompanyById(companyId: string): Promise<Company | null>;
	updateCompany(company: Company): Promise<void>;
	deleteCompany(companyId: string): Promise<void>;
	ensureCompany(company: Company): Promise<void>;
}

@singleton()
class D1CompanyStore implements CompanyStore {
	constructor(@inject('DB') private db: D1Database) {}

	async createCompany(company: Company): Promise<void> {
		const db = drizzle(this.db);
		const date = new Date();
		await db
			.insert(company_d1_schema)
			.values({
				company_id: company.companyId,
				data: JSON.stringify(company.data),
				created_at: date,
				updated_at: date,
			})
			.execute();
	}

	async getCompanyById(companyId: string): Promise<Company | null> {
		const db = drizzle(this.db);
		const results = await db.select().from(company_d1_schema).where(eq(company_d1_schema.company_id, companyId)).execute();
		if (results.length === 0) {
			return null;
		}
		const result = results[0];
		return {
			companyId: result.company_id,
			data: JSON.parse(result.data as string),
			createdAt: result.created_at ? new Date(result.created_at).getTime() : 0,
			updatedAt: result.updated_at ? new Date(result.updated_at).getTime() : 0,
		};
	}

	async updateCompany(company: Company): Promise<void> {
		const db = drizzle(this.db);
		const date = new Date();
		await db
			.update(company_d1_schema)
			.set({
				data: JSON.stringify(company.data),
				updated_at: date,
			})
			.where(eq(company_d1_schema.company_id, company.companyId))
			.execute();
	}

	async deleteCompany(companyId: string): Promise<void> {
		const db = drizzle(this.db);
		await db.delete(company_d1_schema).where(eq(company_d1_schema.company_id, companyId)).execute();
	}

	async ensureCompany(company: Company): Promise<void> {
		const existing = await this.getCompanyById(company.companyId);
		if (!existing) {
			await this.createCompany(company);
		} else {
			await this.updateCompany(company);
		}
	}
}

export { type CompanyStore, D1CompanyStore };
