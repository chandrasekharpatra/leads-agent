import { inject, singleton } from 'tsyringe-neo';
import { RequestContext, TaskExecutionContext, TaskResult } from '../models/internal';
import { type CompanyStore } from '../storage/company_store';
import { type PincodeTechparkMappingStore } from '../storage/pincode_techpark_mapping_store';
import { Company as SavedCompany } from '../storage/stored/stored_company';
import {
    CompanyTaskData,
    HiringManagerTaskData,
    PincodeTaskData,
    TaskData,
    TechparkTaskData,
    ToastmasterTaskData,
} from '../storage/stored/stored_task';
import { Techpark } from '../storage/stored/stored_techpark';
import { type TechparkCompanyMappingStore } from '../storage/techpark_company_mapping_store';
import { type TechParkStore } from '../storage/techpark_store';
import { generateCompanyId, generateTechparkId } from '../utils/id_utils';
import { TaskProcessor } from './task_processor';

@singleton()
export class TaskCompletedProcessor implements TaskProcessor {
	constructor(
		@inject('CompanyStore') private readonly companyStore: CompanyStore,
		@inject('TechParkStore') private readonly techParkStore: TechParkStore,
		@inject('TechparkCompanyMappingStore') private readonly techparkCompanyMappingStore: TechparkCompanyMappingStore,
		@inject('PincodeTechparkMappingStore') private readonly pincodeTechparkMappingStore: PincodeTechparkMappingStore,
	) {}

	canHandle(taskType: string): boolean {
		return taskType === 'TASK_COMPLETED';
	}

	async process(_ctx: RequestContext, _task: TaskData, context: TaskExecutionContext): Promise<TaskResult> {
		console.log(`Processing TASK_COMPLETED for workflow ${context.workflowId}`);
        const { completed } = context.task.data;
		// Extract task data from completed tasks
		const pincodeTaskData = completed.find((t) => t.type === 'PINCODE') as PincodeTaskData;
		const techparkTaskData = completed.find((t) => t.type === 'TECH_PARK') as TechparkTaskData;
		const companyTaskData = completed.find((t) => t.type === 'COMPANY') as CompanyTaskData;
		const toastmasterTaskData = completed.find((t) => t.type === 'TOASTMASTER_CLUB') as ToastmasterTaskData;
		const hiringManagerTaskData = completed.find((t) => t.type === 'HIRING_MANAGER') as HiringManagerTaskData;

		if (!pincodeTaskData || !techparkTaskData || !companyTaskData) {
			console.error('Missing required task data for TASK_COMPLETED processing');
			return {
				nextTasks: []
			};
		}

		// Create and save techpark
		const techpark: Techpark = {
			techparkId: generateTechparkId(techparkTaskData.techparkName, techparkTaskData.address),
			data: {
				name: techparkTaskData.techparkName,
				address: techparkTaskData.address,
				pincode: pincodeTaskData.pincode,
			},
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await this.techParkStore.ensureTechPark(techpark);
		await this.pincodeTechparkMappingStore.ensureMapping(pincodeTaskData.pincode, techpark.techparkId);

		// Create and save company
		const company: SavedCompany = {
			companyId: generateCompanyId(companyTaskData.companyName, companyTaskData.companyAddress),
			data: {
				name: companyTaskData.companyName,
				address: companyTaskData.companyAddress,
				pincode: pincodeTaskData.pincode,
				hrProfiles: hiringManagerTaskData ? hiringManagerTaskData.profiles : [],
				hasToastmasterClub: toastmasterTaskData ? toastmasterTaskData.hasClub : false,
				toastmasterClubUrl: toastmasterTaskData ? toastmasterTaskData.url : undefined,
				employeeCount: companyTaskData.employeeCount,
			},
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await this.companyStore.ensureCompany(company);
		await this.techparkCompanyMappingStore.ensureMapping(techpark.techparkId, company.companyId);

		console.log(`Successfully saved company ${company.data.name} and techpark ${techpark.data.name} to database`);

		return {
			nextTasks: [],
		};
	}
}
