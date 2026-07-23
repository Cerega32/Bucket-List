import {IShortList} from '@/entities/goal/model/types';
import {GET} from '@/shared/api/http/requests';
import {AnyResponsePagination} from '@/shared/types/request';

export const getListsWithGoals = async (codeGoal: string): Promise<AnyResponsePagination<Array<IShortList>>> => {
	const response = await GET(`goals/${codeGoal}/lists`, {auth: true});
	return response;
};
