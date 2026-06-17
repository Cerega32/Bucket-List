import {FC, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';
import {getCookieConsent, initAnalyticsIfConsented, setCookieConsent} from '@/utils/legal/cookieConsent';

import './cookie-banner.scss';

export const CookieBanner: FC = () => {
	const [block, element] = useBem('cookie-banner');
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const consent = getCookieConsent();
		if (!consent) {
			const timer = setTimeout(() => {
				setIsVisible(true);
			}, 500);
			return () => clearTimeout(timer);
		}

		if (consent === 'accepted') {
			initAnalyticsIfConsented();
		}

		return undefined;
	}, []);

	const handleAccept = () => {
		setCookieConsent('accepted');
		setIsVisible(false);
		initAnalyticsIfConsented();
	};

	const handleReject = () => {
		setCookieConsent('rejected');
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
						</Link>
						.
					</p>
				</div>
				<div className={element('actions')}>
					<Button theme="blue-light" className={element('btn')} onClick={handleReject} typeBtn="button">
						Отклонить
					</Button>
					<Button theme="blue" className={element('btn')} onClick={handleAccept} typeBtn="button">
						Принять
					</Button>
				</div>
			</div>
		</div>
	);
};
