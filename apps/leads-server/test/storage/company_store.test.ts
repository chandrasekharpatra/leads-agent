import { container } from 'tsyringe-neo';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Company } from '../../src/storage/stored/stored_company';
import { CompanyStore } from '../../src/storage/company_store';
import { generateCompanyId } from '../../src/utils/id_utils';
import { initTsyringe } from '../tsyringe';

describe('Company store CRUD tests', () => {
	beforeAll(() => {
		initTsyringe();
	});

	afterAll(() => {
		container.clearInstances();
		container.reset();
	});

	it('company crud operations', async () => {
		const companyStore = container.resolve<CompanyStore>('CompanyStore');

		const company: Company = {
			companyId: generateCompanyId('Tech Corporation', 'Electronic City Phase 1, Bangalore'),
			data: {
				name: 'Tech Corporation',
				address: 'Electronic City Phase 1, Bangalore',
				pincode: '560100',
				hrProfiles: [],
				hasToastmasterClub: false,
			},
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await companyStore.createCompany(company);

		const fetchedCompany = await companyStore.getCompanyById(company.companyId);
		expect(fetchedCompany).toBeDefined();
		expect(fetchedCompany?.data.name).toBe('Tech Corporation');
		expect(fetchedCompany?.data.pincode).toBe('560100');

		await companyStore.updateCompany({
			...company,
			data: {
				name: 'Tech Corporation',
				address: 'Electronic City Phase 2, Bangalore',
				pincode: '560101',
				hrProfiles: [],
				hasToastmasterClub: false,
			},
		});

		const updatedCompany = await companyStore.getCompanyById(company.companyId);
		expect(updatedCompany).toBeDefined();
		expect(updatedCompany?.data.address).toBe('Electronic City Phase 2, Bangalore');
		expect(updatedCompany?.data.pincode).toBe('560101');

		await companyStore.deleteCompany(company.companyId);
		const deletedCompany = await companyStore.getCompanyById(company.companyId);
		expect(deletedCompany).toBeNull();
	});
});
