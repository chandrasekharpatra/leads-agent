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
}

interface ToastmasterTaskData {
	type: 'TOASTMASTER_CLUB';
	hasClub: boolean;
	url?: string;
}

interface CompletedTaskData {
	type: 'TASK_COMPLETED';
}

interface Profile {
	name: string;
	linkedInUrl?: string;
}

interface HiringManagerTaskData {
	type: 'HIRING_MANAGER';
	profiles: Profile[];
}

interface NoopTaskData {
	type: 'NOOP';
}

type TaskData = PincodeTaskData | TechparkTaskData | CompanyTaskData | HiringManagerTaskData | ToastmasterTaskData | CompletedTaskData | NoopTaskData;

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

export {
	type Task,
	type TaskData,
	type CompositeData,
	type PincodeTaskData,
	type TechparkTaskData,
	type CompanyTaskData,
	type HiringManagerTaskData,
	type ToastmasterTaskData,
	type CompletedTaskData,
	type NoopTaskData,
};
