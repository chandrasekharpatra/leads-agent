import { validator } from 'hono/validator';
import { z } from 'zod/v4';

const createWorkflowRequest = z.object({
	pincode: z.string(),
});

const resumeWorkflowRequest = z.object({
	workflowId: z.string(),
});

const syncWorkflowRequest = z.object({
	pointer: z.string().optional(),
	direction: z.enum(['FORWARD', 'BACKWARD']),
});

const tokenValidationRequest = z.object({
	token: z.string(),
});

const schemaValidator = (schema: any) => {
	return validator('json', (value, c) => {
		const result = schema.safeParse(value);
		if (!result.success) {
			const response = {
				success: false,
				message: 'Invalid payload',
				errors: result.error.message,
			};
			return c.json(response, 400);
		}
		return result.data;
	});
};

export { createWorkflowRequest, resumeWorkflowRequest, schemaValidator, syncWorkflowRequest, tokenValidationRequest };
