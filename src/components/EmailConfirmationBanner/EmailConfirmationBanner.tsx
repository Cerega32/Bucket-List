import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';
import {postResendConfirmationEmail} from '@/utils/api/post/postResendConfirmationEmail';

import './email-confirmation-banner.scss';

const EMAIL_BANNER_DISMISSED_KEY = 'email_confirmation_banner_dismissed';

export const EmailConfirmationBanner: FC = observer(() => {
	const [block, element] = useBem('email-confirmation-banner');
	const [isVisible, setIsVisible] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [isSent, setIsSent] = useState(false);
	const {isAuth, emailConfirmed, email} = UserStore;

	useEffect(() => {
		// Показываем баннер только если:
		// 1. Пользователь авторизован
		// 2. Email не подтвержден
		// 3. Баннер не был закрыт пользователем
		if (isAuth && !emailConfirmed) {
			const dismissed = localStorage.getItem(EMAIL_BANNER_DISMISSED_KEY);
			if (!dismissed) {
				// Небольшая задержка для плавного появления
				const timer = setTimeout(() => {
					setIsVisible(true);
				}, 1000);
				return () => clearTimeout(timer);
			}
		} else {
			setIsVisible(false);
		}
		return undefined;
	}, [isAuth, emailConfirmed]);

	const handleResend = async () => {
		setIsSending(true);
		const res = await postResendConfirmationEmail();
		if (res.success) {
			setIsSent(true);
			setTimeout(() => {
				setIsSent(false);
			}, 3000);
		}
		setIsSending(false);
	};

	const handleDismiss = () => {
		localStorage.setItem(EMAIL_BANNER_DISMISSED_KEY, 'true');
		setIsVisible(false);
	};

	if (!isVisible) return null;

	return (
		<div className={block()}>
			<div className={element('content')}>
				<div className={element('icon')}>
					<Svg icon="email" />
				</div>
				<div className={element('text')}>
					<p className={element('message')}>
						<strong>Подтвердите ваш email адрес</strong>
						<br />
						Мы отправили письмо на <strong>{email}</strong>. Перейдите по ссылке в письме для подтверждения.
						{isSent && <span className={element('success')}> Письмо отправлено!</span>}
					</p>
					<p className={element('warning')}>Если не подтвердить email в течение 7 дней, аккаунт будет удалён.</p>
				</div>
				<div className={element('actions')}>
					<Button
						theme="blue-light"
						className={element('btn')}
						onClick={handleResend}
						typeBtn="button"
						disabled={isSending || isSent}
					>
						{isSending ? 'Отправка...' : isSent ? 'Отправлено' : 'Отправить повторно'}
					</Button>
					<button type="button" className={element('close')} onClick={handleDismiss} aria-label="Закрыть">
						<Svg icon="cross" />
					</button>
				</div>
			</div>
		</div>
	);
});
