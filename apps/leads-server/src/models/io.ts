import { Profile } from './internal';

interface PaginatedResponse<T> {
	data: T[];
	total: number;
	cursor: string | undefined;
}

interface SyncRequest {
	direction: 'FORWARD' | 'BACKWARD';
	pointer?: string;
	limit: number;
}

interface OutgoingCompanyData {
	name: string;
	address: string;
	pincode: string;
	hrProfiles: Profile[];
	hasToastmasterClub: boolean;
	toastmasterClubUrl?: string;
	employeeCount?: number;
}

interface OutgoingCompany {
	companyId: string;
	data: OutgoingCompanyData;
	createdAt: number;
	updatedAt: number;
}

export { type PaginatedResponse, type SyncRequest, type OutgoingCompany };
