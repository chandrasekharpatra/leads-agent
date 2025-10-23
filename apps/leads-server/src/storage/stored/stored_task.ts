interface PincodeTaskData {
	type: 'PINCODE';
	pincode: string;
}

interface TechparkTaskData {
	type: 'TECH_PARK';
	techparkName: string;
	address: string;
}

interface CompanyTaskData {
	type: 'COMPANY';
	companyName: string;
	industry: string;
	employeeCount: number;
	companyAddress: string;
	hasToastmasterClub: boolean;
}

interface HiringManagerTaskData {
	type: 'HIRING_MANAGER';
	names: string[];
}

type TaskData = PincodeTaskData | TechparkTaskData | CompanyTaskData | HiringManagerTaskData;

interface CompositeData {
	completed: TaskData[];
	next: TaskData[];
}

interface Task {
	taskId: string;
	data: CompositeData;
	createdAt: number;
	updatedAt: number;
}

export { type Task, type TaskData };
