import { inject, singleton } from 'tsyringe-neo';
import { Company, RequestContext, TaskResult } from '../models/internal';
import { type LeadService } from '../services/lead_service';
import { CompanyTaskData, TaskData } from '../storage/stored/stored_task';
import { TaskProcessor } from './task_processor';

@singleton()
export class CompanyTaskProcessor implements TaskProcessor {
	constructor(@inject('LeadService') private readonly leadService: LeadService) {}

	canHandle(taskType: string): boolean {
		return taskType === 'COMPANY';
	}

	async process(_ctx: RequestContext, task: TaskData): Promise<TaskResult> {
		const companyTask = task as CompanyTaskData;

		console.log(`Processing COMPANY task for company: ${companyTask.companyName}`);

		const company: Company = {
			name: companyTask.companyName,
			industry: companyTask.industry,
			employeeCount: companyTask.employeeCount,
			address: companyTask.companyAddress,
		};

        if (companyTask.employeeCount < 500) {
            return {
                nextTasks: [{
                    type: "NOOP" as const,
                }],
            };
        }

        const toastmasterDetail = await this.leadService.findToastmasterClubDetail(company);

		console.log(
			`Gathered details for company ${companyTask.companyName}: Toastmaster club: ${toastmasterDetail.hasClub}`,
		);

		const nextTasks: TaskData[] = [
			{
				type: 'TOASTMASTER_CLUB' as const,
				hasClub: toastmasterDetail.hasClub,
				url: toastmasterDetail.url,
			}
		];

		return {
			nextTasks
		};
	}
}
