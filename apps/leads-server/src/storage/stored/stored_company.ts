interface CompanyData {
	name: string;
	address: string;
	pincode: string;
}

interface Company {
	companyId: string;
	data: CompanyData;
	createdAt: number;
	updatedAt: number;
}

export { type Company, type CompanyData };
