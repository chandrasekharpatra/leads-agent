import { inject, singleton } from 'tsyringe-neo';
import { RequestContext, TaskResult } from '../models/internal';
import { type LeadService } from '../services/lead_service';
import { PincodeTaskData, TaskData } from '../storage/stored/stored_task';
import { TaskProcessor } from './task_processor';

@singleton()
export class PincodeTaskProcessor implements TaskProcessor {
	constructor(@inject('LeadService') private readonly leadService: LeadService) {}

	canHandle(taskType: string): boolean {
		return taskType === 'PINCODE';
	}

	async process(_ctx: RequestContext, task: TaskData): Promise<TaskResult> {
		const pincodeTask = task as PincodeTaskData;

		console.log(`Processing PINCODE task for pincode: ${pincodeTask.pincode}`);

		const techParks = await this.leadService.findTechParksInPincode(pincodeTask.pincode, 10);
		console.log(`Found ${techParks.length} tech parks in pincode ${pincodeTask.pincode}`);

		const nextTasks: TaskData[] = techParks.map((techPark) => ({
			type: 'TECH_PARK' as const,
			techparkName: techPark.name,
			address: techPark.address,
		}));

		return {
			nextTasks,
		};
	}
}
