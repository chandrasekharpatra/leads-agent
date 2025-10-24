import { Profile } from '../../models/internal';

interface CompanyData {
	name: string;
	address: string;
	pincode: string;
	hrProfiles: Profile[];
	hasToastmasterClub: boolean;
	toastmasterClubUrl?: string;
	employeeCount?: number;
}

interface Company {
	companyId: string;
	data: CompanyData;
	createdAt: number;
	updatedAt: number;
}

export { type Company, type CompanyData };
