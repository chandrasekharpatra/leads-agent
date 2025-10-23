interface TechparkData {
	name: string;
	pincode: string;
	address: string;
}

interface Techpark {
	techparkId: string;
	data: TechparkData;
	createdAt: number;
	updatedAt: number;
}

interface TechparkCompanyMapping {
	techparkId: string;
	companyId: string;
	createdAt: number;
	updatedAt: number;
}

export { type Techpark, type TechparkCompanyMapping };
