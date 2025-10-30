import { inject, singleton } from "tsyringe-neo";

interface QueueService {
    enqueueWorkflowExecution(workflowId: string): Promise<void>;
}

@singleton()
class CloudflareQueueService implements QueueService {
    constructor(@inject('TM_LEADS_WORKFLOW_QUEUE') private readonly queue: Queue<unknown>) {}

    async enqueueWorkflowExecution(workflowId: string): Promise<void> {
        await this.queue.send({ workflowId }, { contentType: 'json' });
    }
}

export { CloudflareQueueService, type QueueService };
