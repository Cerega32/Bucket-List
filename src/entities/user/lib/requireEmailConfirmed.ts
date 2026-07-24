import {UserStore} from '@/entities/user/model/UserStore';
import {NotificationStore} from '@/shared/model/NotificationStore';

export const EMAIL_CONFIRMATION_REQUIRED_MESSAGE =
	'Для выполнения этого действия необходимо подтвердить email в настройках. ' +
	'Проверьте почту и перейдите по ссылке для подтверждения.';

let lastEmailConfirmationNoticeAt = 0;

export const notifyEmailConfirmationRequired = (): void => {
	const now = Date.now();
	if (now - lastEmailConfirmationNoticeAt < 1500) {
		return;
	}
	lastEmailConfirmationNoticeAt = now;

	NotificationStore.addNotification({
		type: 'error',
		title: 'Ошибка',
		message: EMAIL_CONFIRMATION_REQUIRED_MESSAGE,
	});
};

/** Возвращает true, если email подтверждён. Иначе показывает toast и возвращает false. */
export const requireEmailConfirmed = (): boolean => {
	if (UserStore.emailConfirmed) {
		return true;
	}

	notifyEmailConfirmationRequired();
	return false;
};

/** Для ссылок: блокирует переход, если email не подтверждён. */
export const handleEmailConfirmedNavigate = (event: {preventDefault: () => void}): boolean => {
	if (requireEmailConfirmed()) {
		return true;
	}

	event.preventDefault();
	return false;
};
