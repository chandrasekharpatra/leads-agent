interface PaginatedResponse<T> {
	data: T[];
	total: number;
	cursor: string | undefined;
}

interface SyncRequest {
	direction: 'FORWARD' | 'BACKWARD';
	pointer?: string;
	limit: number;
}

export { type PaginatedResponse, type SyncRequest };
