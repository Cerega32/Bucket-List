import {IShortList} from '@/typings/goal';
import {AnyResponsePagination} from '@/typings/request';
import {GET} from '@/utils/fetch/requests';

export const getListsWithGoals = async (codeGoal: string): Promise<AnyResponsePagination<Array<IShortList>>> => {
	const response = await GET(`goals/${codeGoal}/lists`, {auth: true});
	return response;
};
