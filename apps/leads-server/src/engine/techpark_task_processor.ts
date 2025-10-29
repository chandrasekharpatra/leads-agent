import { inject, singleton } from 'tsyringe-neo';
import { RequestContext, TaskResult } from '../models/internal';
import { type LeadService } from '../services/lead_service';
import { TaskData, TechparkTaskData } from '../storage/stored/stored_task';
import { TaskProcessor } from './task_processor';

@singleton()
export class TechparkTaskProcessor implements TaskProcessor {
	constructor(@inject('LeadService') private readonly leadService: LeadService) {}

	canHandle(taskType: string): boolean {
		return taskType === 'TECH_PARK';
	}

	async process(_ctx: RequestContext, task: TaskData): Promise<TaskResult> {
		const techparkTask = task as TechparkTaskData;

		console.log(`Processing TECH_PARK task for tech park: ${techparkTask.techparkName}`);

		const companies = await this.leadService.findCompaniesInTechPark({
			name: techparkTask.techparkName,
			address: techparkTask.address,
		});

		const nextTasks: TaskData[] = companies.map((company) => ({
			type: 'COMPANY' as const,
			companyName: company.name,
			industry: company.industry,
			employeeCount: company.employeeCount,
			companyAddress: company.address,
		}));

		return {
			nextTasks: nextTasks,
		};
	}
}
