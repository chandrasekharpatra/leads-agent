import { container } from 'tsyringe-neo';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UserWorkflowMapping } from '../../src/storage/stored/stored_user';
import { UserWorkflowMappingStore } from '../../src/storage/user_workflow_mapping_store';
import { workflowIdGenerator } from '../../src/utils/id_utils';
import { initTsyringe } from '../tsyringe';

describe('User workflow mapping store CRUD tests', () => {
	beforeAll(() => {
		initTsyringe();
	});

	afterAll(() => {
		container.clearInstances();
		container.reset();
	});

	it('user workflow mapping crud operations', async () => {
		const userWorkflowMappingStore = container.resolve<UserWorkflowMappingStore>('UserWorkflowMappingStore');

		const userId = 'user_123';
		const workflowId = workflowIdGenerator();

		const mapping: UserWorkflowMapping = {
			userId: userId,
			workflowId: workflowId,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await userWorkflowMappingStore.createMapping(mapping);

		const fetchedMapping = await userWorkflowMappingStore.getMapping(mapping.userId, mapping.workflowId);
		expect(fetchedMapping).toBeDefined();
		expect(fetchedMapping?.userId).toBe(userId);
		expect(fetchedMapping?.workflowId).toBe(workflowId);

		// Test ensureMapping (should not create duplicate)
		await userWorkflowMappingStore.ensureMapping(mapping.userId, mapping.workflowId);
		const ensuredMapping = await userWorkflowMappingStore.getMapping(mapping.userId, mapping.workflowId);
		expect(ensuredMapping).toBeDefined();
		expect(ensuredMapping?.userId).toBe(userId);

		await userWorkflowMappingStore.deleteMapping(mapping.userId, mapping.workflowId);
		const deletedMapping = await userWorkflowMappingStore.getMapping(mapping.userId, mapping.workflowId);
		expect(deletedMapping).toBeNull();
	});

	it('user workflow mapping sync operations', async () => {
		const userWorkflowMappingStore = container.resolve<UserWorkflowMappingStore>('UserWorkflowMappingStore');

		const userId = 'user_456';
		const workflowId1 = workflowIdGenerator();
		const workflowId2 = workflowIdGenerator();
		const workflowId3 = workflowIdGenerator();

		// Create multiple mappings for the same user
		const mapping1: UserWorkflowMapping = {
			userId: userId,
			workflowId: workflowId1,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		const mapping2: UserWorkflowMapping = {
			userId: userId,
			workflowId: workflowId2,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		const mapping3: UserWorkflowMapping = {
			userId: userId,
			workflowId: workflowId3,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await userWorkflowMappingStore.createMapping(mapping1);
		await userWorkflowMappingStore.createMapping(mapping2);
		await userWorkflowMappingStore.createMapping(mapping3);

		// Test initial sync (no pointer)
		const initialSync = await userWorkflowMappingStore.sync(userId, {
			direction: 'FORWARD',
			limit: 10,
		});

		expect(initialSync.data.length).toBe(3);
		expect(initialSync.total).toBe(3);
		expect(initialSync.cursor).toBeDefined();

		// Verify all mappings are returned
		const workflowIds = initialSync.data.map((m) => m.workflowId);
		expect(workflowIds).toContain(workflowId1);
		expect(workflowIds).toContain(workflowId2);
		expect(workflowIds).toContain(workflowId3);

		// Test pagination with cursor
		const limitedSync = await userWorkflowMappingStore.sync(userId, {
			direction: 'FORWARD',
			limit: 2,
		});

		expect(limitedSync.data.length).toBe(2);
		expect(limitedSync.cursor).toBeDefined();

		// Clean up
		await userWorkflowMappingStore.deleteMapping(userId, workflowId1);
		await userWorkflowMappingStore.deleteMapping(userId, workflowId2);
		await userWorkflowMappingStore.deleteMapping(userId, workflowId3);
	});
});
