import { createPerplexity, PerplexityProvider } from '@ai-sdk/perplexity';
import { env } from 'cloudflare:test';
import { container } from 'tsyringe-neo';
import { LeadService, PerplexityLeadService } from '../src/services/lead_service';
import { CompanyStore, D1CompanyStore } from '../src/storage/company_store';
import { D1PincodeTechparkMappingStore, PincodeTechparkMappingStore } from '../src/storage/pincode_techpark_mapping_store';
import { D1TaskStore, TaskStore } from '../src/storage/task_store';
import { D1TechparkCompanyMappingStore, TechparkCompanyMappingStore } from '../src/storage/techpark_company_mapping_store';
import { D1TechParkStore, TechParkStore } from '../src/storage/techpark_store';
import { D1UserWorkflowMappingStore, UserWorkflowMappingStore } from '../src/storage/user_workflow_mapping_store';
import { D1WorkflowStore, WorkflowStore } from '../src/storage/workflow_store';
import { D1WorkflowTaskMappingStore, WorkflowTaskMappingStore } from '../src/storage/workflow_task_mapping_store';

export const initTsyringe = () => {
	// values
	container.register<string>('PERPLEXITY_API_KEY', { useValue: env.PERPLEXITY_API_KEY });
	container.register<string>('JWT_SECRET', { useValue: env.JWT_SECRET });
	container.register<D1Database>('DB', { useValue: env.DB });

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

	// llm providers
	const perplexity = createPerplexity({
		apiKey: env.PERPLEXITY_API_KEY,
	});
	container.register<PerplexityProvider>('PerplexityProvider', { useValue: perplexity });
};
