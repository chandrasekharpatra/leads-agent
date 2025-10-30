interface WorkflowMessage {
	workflowId: string;
}

export default {
	async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {
		// A queue consumer can make requests to other endpoints on the Internet,
		// write to R2 object storage, query a D1 Database, and much more.
		for (let message of batch.messages) {
			// Process each message (we'll just log these)
			const workflowMessage = message.body as WorkflowMessage;
			const startTime = Date.now();
			console.log(`processing workflow message: ${workflowMessage.workflowId}`);
			const controller = new AbortController();
			const id = setTimeout(() => controller.abort(), 900000);
			await env.LEADS_SERVER.fetch(`https://leads-server.com/v1/workflows/${workflowMessage.workflowId}/resume`, {
				method: 'GET',
				signal: controller.signal,
				headers: {
					Authorization: `Bearer ${env.AUTH_TOKEN}`,
				},
			});
			clearTimeout(id);
			const endTime = Date.now();
			console.log(`workflow ${workflowMessage.workflowId} processed in ${endTime - startTime} ms`);
		}
	},
} satisfies ExportedHandler<Env, Error>;
