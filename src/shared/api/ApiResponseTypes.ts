/**
 * Типы ответов API
 */

export interface ErrorResponse {
	status?: number;
	message?: string;
	error?: string;
	errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: ErrorResponse;
	message?: string;
}
