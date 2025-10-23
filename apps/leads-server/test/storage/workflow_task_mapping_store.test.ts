import { container } from 'tsyringe-neo';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WorkflowTaskMapping } from '../../src/storage/stored/stored_workflow';
import { WorkflowTaskMappingStore } from '../../src/storage/workflow_task_mapping_store';
import { workflowIdGenerator, taskIdGenerator } from '../../src/utils/id_utils';
import { initTsyringe } from '../tsyringe';

describe('Workflow task mapping store CRUD tests', () => {

	beforeAll(() => {
        initTsyringe();
    })

    afterAll(() => {
        container.clearInstances();
        container.reset()
    })

    it('workflow task mapping crud operations', async () => {
        const workflowTaskMappingStore = container.resolve<WorkflowTaskMappingStore>('WorkflowTaskMappingStore');

        const workflowId = workflowIdGenerator();
        const taskId = taskIdGenerator();

        const mapping: WorkflowTaskMapping = {
            workflowId: workflowId,
            taskId: taskId,
            state: 'PENDING',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        await workflowTaskMappingStore.createMapping(mapping);

        const fetchedMapping = await workflowTaskMappingStore.getMapping(mapping.workflowId, mapping.taskId);
        expect(fetchedMapping).toBeDefined();
        expect(fetchedMapping?.workflowId).toBe(workflowId);
        expect(fetchedMapping?.taskId).toBe(taskId);

        // Test ensureMapping (should not create duplicate)
        await workflowTaskMappingStore.ensureMapping(mapping.workflowId, mapping.taskId);
        const ensuredMapping = await workflowTaskMappingStore.getMapping(mapping.workflowId, mapping.taskId);
        expect(ensuredMapping).toBeDefined();
        expect(ensuredMapping?.workflowId).toBe(workflowId);

        await workflowTaskMappingStore.deleteMapping(mapping.workflowId, mapping.taskId);
        const deletedMapping = await workflowTaskMappingStore.getMapping(mapping.workflowId, mapping.taskId);
        expect(deletedMapping).toBeNull();
    });

    it('workflow task mapping sync operations', async () => {
        const workflowTaskMappingStore = container.resolve<WorkflowTaskMappingStore>('WorkflowTaskMappingStore');

        const workflowId = workflowIdGenerator();
        const taskId1 = taskIdGenerator();
        const taskId2 = taskIdGenerator();
        const taskId3 = taskIdGenerator();

        // Create multiple mappings for the same workflow
        const mapping1: WorkflowTaskMapping = {
            workflowId: workflowId,
            taskId: taskId1,
            state: 'PENDING',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const mapping2: WorkflowTaskMapping = {
            workflowId: workflowId,
            taskId: taskId2,
            state: 'PENDING',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const mapping3: WorkflowTaskMapping = {
            workflowId: workflowId,
            taskId: taskId3,
            state: 'PENDING',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        await workflowTaskMappingStore.createMapping(mapping1);
        await workflowTaskMappingStore.createMapping(mapping2);
        await workflowTaskMappingStore.createMapping(mapping3);

        // Test initial sync (no pointer)
        const initialSync = await workflowTaskMappingStore.sync(workflowId, {
            direction: 'FORWARD',
            limit: 10
        });

        expect(initialSync.data.length).toBe(3);
        expect(initialSync.total).toBe(3);
        expect(initialSync.cursor).toBeDefined();

        // Verify all mappings are returned
        const taskIds = initialSync.data.map(m => m.taskId);
        expect(taskIds).toContain(taskId1);
        expect(taskIds).toContain(taskId2);
        expect(taskIds).toContain(taskId3);

        // Test pagination with cursor
        const limitedSync = await workflowTaskMappingStore.sync(workflowId, {
            direction: 'FORWARD',
            limit: 2
        });

        expect(limitedSync.data.length).toBe(2);
        expect(limitedSync.cursor).toBeDefined();

        // Clean up
        await workflowTaskMappingStore.deleteMapping(workflowId, taskId1);
        await workflowTaskMappingStore.deleteMapping(workflowId, taskId2);
        await workflowTaskMappingStore.deleteMapping(workflowId, taskId3);
    });
});
