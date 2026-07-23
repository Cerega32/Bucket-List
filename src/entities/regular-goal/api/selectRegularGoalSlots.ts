import {POST} from '@/shared/api/http/requests';

interface SelectRegularGoalSlotsResponse {
	success: boolean;
	message?: string;
	regularGoalsSelectionPending?: boolean;
	error?: string;
}

export const selectRegularGoalSlots = async (regularGoalIds: number[]) => {
	const response = await POST('goals/regular/select-slots/', {
		auth: true,
		body: {regular_goal_ids: regularGoalIds},
	});

	return {
		success: response.success || false,
		data: response.data as SelectRegularGoalSlotsResponse | undefined,
		error: response.error || response.errors || undefined,
	};
};
