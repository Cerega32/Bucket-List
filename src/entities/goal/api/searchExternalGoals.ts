import {GET} from '@/shared/api/http/requests';

export const searchExternalGoals = async (category: string | undefined, query: string) => {
	return GET('goals/search-external', {get: {category, query}});
};
