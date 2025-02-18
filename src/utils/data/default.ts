import {IPaginationPage} from '@/typings/request';

import {IInfoStats} from '../../typings/user';

export const defaultPagination: IPaginationPage = {
	itemsPerPage: 0,
	page: 0,
	totalPages: 0,
	totalItems: 0,
};

export const defaultInfoStats: IInfoStats = {
	experienceEarned: 0,
	goalsCompleted: 0,
	reviewsAdded: 0,
};
