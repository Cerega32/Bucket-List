import {GET} from '@/shared/api/http/requests';

export const getUserAchievements = async (userId: string) => {
	return GET('achievements', {get: {user_id: userId}});
};
