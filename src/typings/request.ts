export interface IPaginationPage {
	itemsPerPage: number;
	page: number;
	totalPages: number;
	totalItems: number;
}

export interface IErrorResponse {
	success: false;
	error: string;
}

export interface ISuccessResponse<T> {
	success: true;
	data: T;
}

export interface ISuccessResponseWithPagination<T> {
	success: true;
	data: {
		pagination: IPaginationPage;
		data: T;
	};
}

export type AnyResponse<T> = ISuccessResponse<T> | IErrorResponse;

export type AnyResponsePagination<T> = ISuccessResponseWithPagination<T> | IErrorResponse;
