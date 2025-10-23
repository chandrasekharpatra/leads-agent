import { container } from 'tsyringe-neo';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Task } from '../../src/storage/stored/stored_task';
import { TaskStore } from '../../src/storage/task_store';
import { taskIdGenerator } from '../../src/utils/id_utils';
import { initTsyringe } from '../tsyringe';

describe('Task store CRUD tests', () => {

	beforeAll(() => {
        initTsyringe();
    })

    afterAll(() => {
        container.clearInstances();
        container.reset()
    })

    it('task crud operations', async () => {
        const taskStore = container.resolve<TaskStore>('TaskStore');

        const task: Task = {
            taskId: taskIdGenerator(),
            data: {
                completed: [{
                    type: 'PINCODE',
                    pincode: '560001'
                }],
                next: [{
                    type: 'TECH_PARK',
                    techparkName: 'Electronic City',
                    address: 'Electronic City Phase 1, Bangalore'
                }]
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        await taskStore.createTask(task);

        const fetchedTask = await taskStore.getTaskById(task.taskId);
        expect(fetchedTask).toBeDefined();
        expect(fetchedTask?.data.completed.length).toBe(1);
        expect(fetchedTask?.data.next.length).toBe(1);

        await taskStore.updateTask({
            ...task,
            data: {
                completed: [{
                    type: 'PINCODE',
                    pincode: '560001'
                }, {
                    type: 'TECH_PARK',
                    techparkName: 'Electronic City',
                    address: 'Electronic City Phase 1, Bangalore'
                }],
                next: [{
                    type: 'COMPANY',
                    companyName: 'Tech Corp',
                    industry: 'Software',
                    employeeCount: 500,
                    companyAddress: 'Electronic City Phase 1',
                    hasToastmasterClub: true
                }]
            }
        });

        const updatedTask = await taskStore.getTaskById(task.taskId);
        expect(updatedTask).toBeDefined();
        expect(updatedTask?.data.completed.length).toBe(2);
        expect(updatedTask?.data.next.length).toBe(1);
        expect(updatedTask?.data.next[0].type).toBe('COMPANY');

        await taskStore.deleteTask(task.taskId);
        const deletedTask = await taskStore.getTaskById(task.taskId);
        expect(deletedTask).toBeNull();
    });
});
