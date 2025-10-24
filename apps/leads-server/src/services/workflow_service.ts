import { inject, singleton } from 'tsyringe-neo';
import { WorkflowEngine } from '../engine/workflow_engine';
import { RequestContext } from '../models/internal';
import { type CompanyStore } from '../storage/company_store';
import { type PincodeTechparkMappingStore } from '../storage/pincode_techpark_mapping_store';
import {
    Task,
    TaskData
} from '../storage/stored/stored_task';
import { Workflow, WorkflowData } from '../storage/stored/stored_workflow';
import { type TaskStore } from '../storage/task_store';
import { type TechparkCompanyMappingStore } from '../storage/techpark_company_mapping_store';
import { type TechParkStore } from '../storage/techpark_store';
import { type UserWorkflowMappingStore } from '../storage/user_workflow_mapping_store';
import { type WorkflowStore } from '../storage/workflow_store';
import { type WorkflowTaskMappingStore } from '../storage/workflow_task_mapping_store';
import { taskIdGenerator, workflowIdGenerator } from '../utils/id_utils';
import { type LeadService } from './lead_service';

interface WorkflowService {
	startWorkflow(ctx: RequestContext, data: WorkflowData): Promise<Workflow>;
	init(ctx: RequestContext, pincode: string): Promise<Workflow>;
	resume(ctx: RequestContext, workflowId: string): Promise<void>;
}

@singleton()
class WorkflowServiceImpl implements WorkflowService {
	constructor(
		@inject('WorkflowStore') private readonly workflowStore: WorkflowStore,
		@inject('TaskStore') private readonly taskStore: TaskStore,
		@inject('TechParkStore') private readonly techParkStore: TechParkStore,
		@inject('CompanyStore') private readonly companyStore: CompanyStore,
		@inject('UserWorkflowMappingStore') private readonly userWorkflowMappingStore: UserWorkflowMappingStore,
		@inject('WorkflowTaskMappingStore') private readonly workflowTaskMappingStore: WorkflowTaskMappingStore,
		@inject('TechparkCompanyMappingStore') private readonly techparkCompanyMappingStore: TechparkCompanyMappingStore,
		@inject('PincodeTechparkMappingStore') private readonly pincodeTechparkMappingStore: PincodeTechparkMappingStore,
		@inject('LeadService') private readonly leadService: LeadService,
        @inject(WorkflowEngine) private readonly workflowEngine: WorkflowEngine,
	) {}

	async startWorkflow(ctx: RequestContext, data: WorkflowData): Promise<Workflow> {
		const workflow: Workflow = {
			workflowId: workflowIdGenerator(),
			data,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};
		await this.workflowStore.createWorkflow(workflow);
		await this.userWorkflowMappingStore.createMapping({
			userId: ctx.userId,
			workflowId: workflow.workflowId,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
		return workflow;
	}

	async init(ctx: RequestContext, pincode: string): Promise<Workflow> {
		const workflow = await this.startWorkflow(ctx, { state: 'PENDING' });
		const pincodeTaskData: TaskData = {
			type: 'PINCODE',
			pincode,
		};

		const rootTask: Task = {
			taskId: taskIdGenerator(),
			data: {
				completed: [],
				next: [pincodeTaskData],
			},
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};
		await this.taskStore.createTask(rootTask);
		await this.workflowTaskMappingStore.ensureMapping(workflow.workflowId, rootTask.taskId);
		return workflow;
	}

    async resume(ctx: RequestContext, workflowId: string): Promise<void> {
        await this.workflowEngine.execute(ctx, workflowId);
    }

	// async resume(ctx: RequestContext, workflowId: string): Promise<void> {
	// 	const outerWorkflow = await this.workflowStore.getWorkflowById(workflowId);
	// 	if (!outerWorkflow) {
	// 		console.error(`Workflow with ID ${workflowId} not found during completion loop, exiting.`);
	// 		return;
	// 	}
	// 	outerWorkflow.data.state = 'IN_PROGRESS';
	// 	await this.workflowStore.updateWorkflow(outerWorkflow);
	// 	for (let i = 0; i < 1000; i++) {
	// 		const workflow = await this.workflowStore.getWorkflowById(workflowId);
	// 		if (!workflow) {
	// 			console.error(`Workflow with ID ${workflowId} not found during completion loop, exiting.`);
	// 			break;
	// 		}
	// 		if (workflow.data.state === 'COMPLETED') {
	// 			console.log(`Workflow with ID ${workflowId} is already completed, exiting loop.`);
	// 			break;
	// 		}
	// 		const syncResponse = await this.workflowTaskMappingStore.sync(workflowId, {
	// 			direction: 'FORWARD',
	// 			limit: 1,
	// 			pointer: workflow.data.pointer,
	// 		});
	// 		if (syncResponse.data.length === 0) {
	// 			workflow.data.state = 'COMPLETED';
	// 			console.log(`No more tasks to process. Marking workflow ID ${workflowId} as COMPLETED.`);
	// 			await this.workflowStore.updateWorkflow(workflow);
	// 			break;
	// 		}
	// 		const mapping = syncResponse.data[0];

	// 		workflow.data.pointer = syncResponse.cursor;
	// 		await this.workflowStore.updateWorkflow(workflow);

	// 		const task = await this.taskStore.getTaskById(mapping.taskId);
	// 		if (!task) {
	// 			console.error(`Task with ID ${mapping.taskId} not found, skipping to next.`);
	// 			continue;
	// 		}
	// 		if (task.data.next.length === 0) {
	// 			continue;
	// 		}
	// 		console.log(`processing workflow ${workflow.workflowId} at task ${task.taskId}`);
	// 		const nextTask = task.data.next[0];
	// 		switch (nextTask.type) {
	// 			case 'PINCODE': {
	// 				const techParks = await this.leadService.findTechParksInPincode(nextTask.pincode, 10);
	// 				const promises = techParks.map(async (techPark) => {
	// 					const techParkTaskData: TaskData = {
	// 						type: 'TECH_PARK',
	// 						techparkName: techPark.name,
	// 						address: techPark.address,
	// 					};
	// 					const techParkTask: Task = {
	// 						taskId: taskIdGenerator(),
	// 						data: {
	// 							completed: [...task.data.completed, nextTask],
	// 							next: [techParkTaskData],
	// 						},
	// 						createdAt: Date.now(),
	// 						updatedAt: Date.now(),
	// 					};
	// 					await this.taskStore.createTask(techParkTask);
	// 					await this.workflowTaskMappingStore.ensureMapping(workflow.workflowId, techParkTask.taskId);
	// 				});
	// 				await Promise.all(promises);
	// 				break;
	// 			}
	// 			case 'TECH_PARK': {
	// 				const companies = await this.leadService.findCompaniesInTechPark({
	// 					name: nextTask.techparkName,
	// 					address: nextTask.address,
	// 				});
	// 				const promises = companies
	// 					.filter((company) => company.employeeCount >= 500)
	// 					.map(async (company) => {
	// 						const companyTaskData: TaskData = {
	// 							type: 'COMPANY',
	// 							companyName: company.name,
	// 							industry: company.industry,
	// 							employeeCount: company.employeeCount,
	// 							companyAddress: company.address,
	// 						};
	// 						const companyTask: Task = {
	// 							taskId: taskIdGenerator(),
	// 							data: {
	// 								completed: [...task.data.completed, nextTask],
	// 								next: [companyTaskData],
	// 							},
	// 							createdAt: Date.now(),
	// 							updatedAt: Date.now(),
	// 						};
	// 						await this.taskStore.createTask(companyTask);
	// 						await this.workflowTaskMappingStore.ensureMapping(workflow.workflowId, companyTask.taskId);
	// 					});
	// 				await Promise.all(promises);
	// 				break;
	// 			}
	// 			case 'COMPANY': {
	// 				const company: Company = {
	// 					name: nextTask.companyName,
	// 					industry: nextTask.industry,
	// 					employeeCount: nextTask.employeeCount,
	// 					address: nextTask.companyAddress,
	// 				};

	// 				const [toastmasterDetail, profiles] = await Promise.all([
	// 					this.leadService.findToastmasterClubDetail(company),
	// 					this.leadService.findHiringManagerHead(company),
	// 				]);

	// 				const toastmasterTaskData: TaskData = {
	// 					type: 'TOASTMASTER_CLUB',
	// 					hasClub: toastmasterDetail.hasClub,
	// 					url: toastmasterDetail.url,
	// 				};

	// 				const hiringManagerTaskData: TaskData = {
	// 					type: 'HIRING_MANAGER',
	// 					profiles,
	// 				};

	// 				const completedTaskData: TaskData = {
	// 					type: 'TASK_COMPLETED',
	// 				};

	// 				const finalTask: Task = {
	// 					taskId: taskIdGenerator(),
	// 					data: {
	// 						completed: [...task.data.completed, nextTask, toastmasterTaskData, hiringManagerTaskData],
	// 						next: [completedTaskData],
	// 					},
	// 					createdAt: Date.now(),
	// 					updatedAt: Date.now(),
	// 				};
	// 				await this.taskStore.createTask(finalTask);
	// 				await this.workflowTaskMappingStore.ensureMapping(workflow.workflowId, finalTask.taskId);
	// 				break;
	// 			}
	// 			case 'TOASTMASTER_CLUB':
	// 			case 'HIRING_MANAGER':
	// 				// These are terminal tasks; no further action needed.
	// 				break;
	// 			case 'TASK_COMPLETED': {
	// 				const pincodeTaskData = task.data.completed.find((t) => t.type === 'PINCODE') as PincodeTaskData;
	// 				const techparkTaskData = task.data.completed.find((t) => t.type === 'TECH_PARK') as TechparkTaskData;
	// 				const companyTaskData = task.data.completed.find((t) => t.type === 'COMPANY') as CompanyTaskData;
	// 				const toastmasterTaskData = task.data.completed.find((t) => t.type === 'TOASTMASTER_CLUB') as ToastmasterTaskData;
	// 				const hiringManagerTaskData = task.data.completed.find((t) => t.type === 'HIRING_MANAGER') as HiringManagerTaskData;

	// 				const techpark: Techpark = {
	// 					techparkId: generateTechparkId(techparkTaskData.techparkName, techparkTaskData.address),
	// 					data: {
	// 						name: techparkTaskData.techparkName,
	// 						address: techparkTaskData.address,
	// 						pincode: pincodeTaskData.pincode,
	// 					},
	// 					createdAt: Date.now(),
	// 					updatedAt: Date.now(),
	// 				};
	// 				await this.techParkStore.ensureTechPark(techpark);
	// 				await this.pincodeTechparkMappingStore.ensureMapping(pincodeTaskData.pincode, techpark.techparkId);

	// 				const company: SavedCompany = {
	// 					companyId: generateCompanyId(companyTaskData.companyName, companyTaskData.companyAddress),
	// 					data: {
	// 						name: companyTaskData.companyName,
	// 						address: companyTaskData.companyAddress,
	// 						pincode: pincodeTaskData.pincode,
	// 						hrProfiles: hiringManagerTaskData ? hiringManagerTaskData.profiles : [],
	// 						hasToastmasterClub: toastmasterTaskData ? toastmasterTaskData.hasClub : false,
	// 						toastmasterClubUrl: toastmasterTaskData ? toastmasterTaskData.url : undefined,
	// 						employeeCount: companyTaskData.employeeCount,
	// 					},
	// 					createdAt: Date.now(),
	// 					updatedAt: Date.now(),
	// 				};
	// 				await this.companyStore.ensureCompany(company);
	// 				await this.techparkCompanyMappingStore.ensureMapping(techpark.techparkId, company.companyId);
	// 				break;
	// 			}
	// 			default:
	// 				console.warn('Unknown task type skipping.');
	// 		}
	// 	}
	// 	console.log(`Workflow with ID ${workflowId} has been completed.`);
	// }
}

export { WorkflowServiceImpl, type WorkflowService };
