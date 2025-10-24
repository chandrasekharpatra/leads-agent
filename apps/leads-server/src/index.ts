import { createPerplexity, PerplexityProvider } from '@ai-sdk/perplexity';
import { Hono } from 'hono';
import 'reflect-metadata';
import 'tslib';
import { tsyringe } from './middleware/tysringe_middleware';
import { login, workflows, leads, tasks } from './routes';
import { LeadService, PerplexityLeadService } from './services/lead_service';
import { WorkflowService, WorkflowServiceImpl } from './services/workflow_service';
import { CompanyStore, D1CompanyStore } from './storage/company_store';
import { D1PincodeTechparkMappingStore, PincodeTechparkMappingStore } from './storage/pincode_techpark_mapping_store';
import { D1TaskStore, TaskStore } from './storage/task_store';
import { D1TechparkCompanyMappingStore, TechparkCompanyMappingStore } from './storage/techpark_company_mapping_store';
import { D1TechParkStore, TechParkStore } from './storage/techpark_store';
import { D1UserWorkflowMappingStore, UserWorkflowMappingStore } from './storage/user_workflow_mapping_store';
import { D1WorkflowStore, WorkflowStore } from './storage/workflow_store';
import { D1WorkflowTaskMappingStore, WorkflowTaskMappingStore } from './storage/workflow_task_mapping_store';
import { TaskService, TaskServiceImpl } from './services/task_service';

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
	const middleware = tsyringe((container) => {
		// values
		container.register<string>('PERPLEXITY_API_KEY', { useValue: c.env.PERPLEXITY_API_KEY });
		container.register<string>('JWT_SECRET', { useValue: c.env.JWT_SECRET });
		container.register<D1Database>('DB', { useValue: c.env.DB });

		// stores
		container.register<TechParkStore>('TechParkStore', { useClass: D1TechParkStore });
		container.register<PincodeTechparkMappingStore>('PincodeTechparkMappingStore', { useClass: D1PincodeTechparkMappingStore });
		container.register<CompanyStore>('CompanyStore', { useClass: D1CompanyStore });
		container.register<TaskStore>('TaskStore', { useClass: D1TaskStore });
		container.register<TechparkCompanyMappingStore>('TechparkCompanyMappingStore', { useClass: D1TechparkCompanyMappingStore });
		container.register<WorkflowStore>('WorkflowStore', { useClass: D1WorkflowStore });
		container.register<WorkflowTaskMappingStore>('WorkflowTaskMappingStore', { useClass: D1WorkflowTaskMappingStore });
		container.register<UserWorkflowMappingStore>('UserWorkflowMappingStore', { useClass: D1UserWorkflowMappingStore });

		// services
		container.register<LeadService>('LeadService', { useClass: PerplexityLeadService });
		container.register<WorkflowService>('WorkflowService', { useClass: WorkflowServiceImpl });
		container.register<TaskService>('TaskService', { useClass: TaskServiceImpl });

		// llm providers
		const perplexity = createPerplexity({
			apiKey: c.env.PERPLEXITY_API_KEY,
		});
		container.register<PerplexityProvider>('PerplexityProvider', { useValue: perplexity });
	});
	await middleware(c, next);
});

app.route('/v1/login', login);
app.route('/v1/workflows', workflows);
app.route('/v1/leads', leads);
app.route('/v1/tasks', tasks);

export default app;
