import { inject, singleton } from "tsyringe-neo";
import { Company, RequestContext, TaskExecutionContext, TaskResult } from "../models/internal";
import { type LeadService } from "../services/lead_service";
import { CompanyTaskData, TaskData, ToastmasterTaskData } from "../storage/stored/stored_task";
import { TaskProcessor } from "./task_processor";

@singleton()
class ToastmasterClubTaskProcessor implements TaskProcessor {
    constructor(@inject('LeadService') private readonly leadService: LeadService) {}
    
    canHandle(taskType: string): boolean {
        return taskType === 'TOASTMASTER_CLUB';
    }

    async process(_ctx: RequestContext, task: TaskData, context: TaskExecutionContext): Promise<TaskResult> {
        console.log(`Processing TOASTMASTER_CLUB task: ${task.type}`);
        const { completed } = context.task.data;
        const toastmasterTaskData = task as ToastmasterTaskData;
        if (toastmasterTaskData.hasClub) {
            return {
                nextTasks: [{
                    type: "NOOP" as const,
                }]
            };
        }

        const companyTaskData = completed.find((t) => t.type === 'COMPANY') as CompanyTaskData;
        const company: Company = {
			name: companyTaskData.companyName,
			industry: companyTaskData.industry,
			employeeCount: companyTaskData.employeeCount,
			address: companyTaskData.companyAddress,
		};
        const hmProfiles = await this.leadService.findHiringManagerHead(company);
        return {
            nextTasks: [{
                type: 'HIRING_MANAGER' as const,
                profiles: hmProfiles,
            }]
        };
    }
}

export { ToastmasterClubTaskProcessor };
