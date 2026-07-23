import {POST} from '@/shared/api/http/requests';

interface IResError {
	success: false;
	error: string;
}

interface IResSuccess {
	success: true;
}

export const postReportComment = async (commentId: number, reason: string, text: string): Promise<IResError | IResSuccess> => {
	const response = await POST(`comments/${commentId}/report`, {
		auth: true,
		body: {reason, text},
	});
	return response;
};
