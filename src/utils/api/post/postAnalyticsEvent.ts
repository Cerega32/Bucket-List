import {POST} from '@/utils/fetch/requests';

export const postAnalyticsEvent = async (payload: {
	name: 'reg_open' | 'registration_success';
	source?: 'start_path' | 'header' | 'page' | 'about' | 'login_modal' | 'other' | '';
	sessionId: string;
}) => {
	return POST('analytics/event', {
		body: {
			name: payload.name,
			source: payload.source ?? '',
			sessionId: payload.sessionId,
		},
		showErrorNotification: false,
	});
};
