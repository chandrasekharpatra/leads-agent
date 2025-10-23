interface TechPark {
	name: string;
	pincode: string;
	address: string;
}

interface Company {
	name: string;
	industry: string;
	employeeCount: number;
	nameOfHiringManagerLeads: string[];
	hasToastmasterClub: boolean;
	techParkName: string;
}

interface HiringManagerHead {
	name: string;
}

export { type TechPark, type Company, type HiringManagerHead };
