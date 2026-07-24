import {FC, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {
	COOKIE_CONSENT_RESET_EVENT,
	clearYandexMetrikaCookies,
	getCookieConsent,
	initAnalyticsIfConsented,
	setCookieConsent,
} from '@/shared/config/legal/cookieConsent';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Button} from '@/shared/ui/Button/Button';

import '@/widgets/cookie-banner/cookie-banner.scss';

export const CookieBanner: FC = () => {
	const [block, element] = useBem('cookie-banner');
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		let mountTimer: ReturnType<typeof setTimeout> | undefined;

		const syncBannerState = (immediate = false) => {
			const consent = getCookieConsent();
			if (!consent) {
				if (immediate) {
					setIsVisible(true);
					return;
				}

				mountTimer = setTimeout(() => {
					setIsVisible(true);
				}, 500);
				return;
			}

			setIsVisible(false);
			if (consent === 'accepted') {
				initAnalyticsIfConsented();
			}
		};

		syncBannerState();

		const handleReset = () => {
			if (mountTimer) {
				clearTimeout(mountTimer);
			}
			syncBannerState(true);
		};

		window.addEventListener(COOKIE_CONSENT_RESET_EVENT, handleReset);

		return () => {
			if (mountTimer) {
				clearTimeout(mountTimer);
			}
			window.removeEventListener(COOKIE_CONSENT_RESET_EVENT, handleReset);
		};
	}, []);

	const handleAccept = () => {
		setCookieConsent('accepted');
		setIsVisible(false);
		initAnalyticsIfConsented();
	};

	const handleReject = () => {
		setCookieConsent('rejected');
		clearYandexMetrikaCookies();
		setIsVisible(false);
	};

	if (!isVisible) return null;

	return (
		<div className={block()}>
			<div className={element('content')}>
				<div className={element('text')}>
					<p className={element('message')}>
						Мы используем обязательные cookie для работы сайта. С вашего согласия подключаем сервис{' '}
						<strong>Яндекс.Метрика</strong>, в том числе <strong>Вебвизор</strong>, для анализа посещаемости и улучшения
						интерфейса. Подробнее — в{' '}
						<Link to="/cookies" className={element('link')} target="_blank" rel="noopener noreferrer">
							Политике использования cookie
						</Link>{' '}
						и{' '}
						<Link to="/privacy" className={element('link')} target="_blank" rel="noopener noreferrer">
							Политике конфиденциальности
						</Link>
						.
					</p>
				</div>
				<div className={element('actions')}>
					<Button theme="blue-light" className={element('btn')} onClick={handleReject} typeBtn="button">
						Только необходимые
					</Button>
					<Button theme="blue" className={element('btn')} onClick={handleAccept} typeBtn="button">
						Принять
					</Button>
				</div>
			</div>
		</div>
	);
};
