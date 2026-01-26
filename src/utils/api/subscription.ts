import {GET, POST, PUT} from '@/utils/fetch/requests';

export interface ISubscription {
	subscriptionType: 'free' | 'premium';
	subscriptionExpiresAt: string | null;
	subscriptionAutoRenew: boolean;
}

export interface IUpdateSubscriptionData {
	subscription_type?: 'free' | 'premium';
	subscription_expires_at?: string | null;
	subscription_auto_renew?: boolean;
}

/**
 * Получить информацию о подписке текущего пользователя
 * Данные возвращаются из endpoint /api/user/ или /api/profile/
 */
export const getUserSubscription = async (): Promise<{
	success: boolean;
	data?: ISubscription;
	error?: string;
}> => {
	try {
		const response = await GET('user', {
			auth: true,
		});

		if (response.success && response.data) {
			return {
				success: true,
				data: {
					subscriptionType: response.data.subscriptionType || 'free',
					subscriptionExpiresAt: response.data.subscriptionExpiresAt || null,
					subscriptionAutoRenew: response.data.subscriptionAutoRenew || false,
				},
			};
		}

		return {
			success: false,
			error: 'Не удалось получить информацию о подписке',
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

/**
 * Обновить подписку пользователя
 * Используется для обновления подписки после оплаты или вручную
 */
export const updateSubscription = async (
	data: IUpdateSubscriptionData
): Promise<{
	success: boolean;
	data?: any;
	error?: string;
}> => {
	try {
		const response = await PUT('subscription/update', {
			body: data,
			auth: true,
		});

		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

export interface IPayment {
	paymentId: string;
	amount: number;
	periodMonths: number;
	autoRenew?: boolean;
	expiresAt: string | null;
}

export interface IPaymentStatus {
	paymentId: string;
	status: 'pending' | 'paid' | 'failed' | 'cancelled';
	amount: number;
	periodMonths: number;
	createdAt: string;
	paidAt: string | null;
	expiresAt: string | null;
}

/**
 * Создать платеж для подписки
 */
export const createPayment = async (
	periodMonths: number,
	autoRenew: boolean
): Promise<{
	success: boolean;
	data?: IPayment;
	error?: string;
}> => {
	try {
		const response = await POST('payment/create', {
			body: {
				period_months: periodMonths,
				auto_renew: autoRenew,
			},
			auth: true,
			showSuccessNotification: false,
		});

		if (response.success && response.data) {
			return {
				success: true,
				data: {
					paymentId: response.data.paymentId,
					amount: response.data.amount,
					periodMonths: response.data.periodMonths,
					autoRenew: response.data.autoRenew,
					expiresAt: response.data.expiresAt,
				},
			};
		}

		return {
			success: false,
			error: response.error || 'Не удалось создать платеж',
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

/**
 * Проверить статус платежа
 */
export const checkPaymentStatus = async (
	paymentId: string
): Promise<{
	success: boolean;
	data?: IPaymentStatus;
	error?: string;
}> => {
	try {
		const response = await GET('payment/status', {
			auth: true,
			get: {
				payment_id: paymentId,
			},
			showSuccessNotification: false,
		});

		if (response.success && response.data) {
			return {
				success: true,
				data: {
					paymentId: response.data.paymentId,
					status: response.data.status,
					amount: response.data.amount,
					periodMonths: response.data.periodMonths,
					createdAt: response.data.createdAt,
					paidAt: response.data.paidAt,
					expiresAt: response.data.expiresAt,
				},
			};
		}

		return {
			success: false,
			error: response.error || 'Не удалось проверить статус платежа',
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

/**
 * Подтвердить оплату (для ручного подтверждения)
 */
export const confirmPayment = async (
	paymentId: string
): Promise<{
	success: boolean;
	data?: any;
	error?: string;
}> => {
	try {
		const response = await POST('payment/confirm', {
			body: {
				payment_id: paymentId,
			},
			auth: true,
			showSuccessNotification: false,
		});

		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};
