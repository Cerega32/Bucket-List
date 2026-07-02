import {GET} from '@/utils/fetch/requests';

export interface ILaunchPromo {
	active: boolean;
	limit: number;
	granted: number;
	spotsRemaining: number;
	premiumDays: number;
}

export const getLaunchPromo = async () => {
	const response = await GET('launch-promo');
	return response;
};
