import {FC, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';

import './cookie-banner.scss';

const COOKIE_CONSENT_KEY = 'cookie_consent';

export const CookieBanner: FC = () => {
	const [block, element] = useBem('cookie-banner');
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Проверяем, был ли уже сделан выбор
		const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
		if (!consent) {
			// TODO: Проверить статус согласия на бэкенде для авторизованных пользователей
			// const backendConsent = await getCookieConsent();
			// if (backendConsent) {
			//   localStorage.setItem(COOKIE_CONSENT_KEY, backendConsent.isAccepted ? 'accepted' : 'rejected');
			//   return;
			// }
			// Небольшая задержка для плавного появления
			const timer = setTimeout(() => {
				setIsVisible(true);
			}, 500);
			return () => clearTimeout(timer);
		} else if (consent === 'accepted') {
			// TODO: Инициализировать аналитические сервисы при загрузке страницы, если согласие уже дано
			// 1. Проверить, не инициализированы ли уже аналитические сервисы
			// 2. Загрузить скрипты Яндекс.Метрики (если используется)
			//    loadYandexMetrikaScript();
			// 3. Загрузить скрипты Google Analytics (если используется)
			//    loadGoogleAnalyticsScript();
		}
		return undefined;
	}, []);

	const handleAccept = () => {
		localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
		setIsVisible(false);
		// TODO: Интеграция с аналитическими сервисами
		// 1. Инициализировать Яндекс.Метрику (если используется)
		//    if (window.ym) window.ym(ACCOUNT_ID, 'init', {...});
		// 2. Инициализировать Google Analytics (если используется)
		//    if (window.gtag) window.gtag('config', 'GA_MEASUREMENT_ID', {...});
		// 3. Отправить согласие на бэкенд (если требуется хранение на сервере)
		//    await postCookieConsent({ isAccepted: true });
	};

	const handleReject = () => {
		localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
		setIsVisible(false);
		// TODO: Интеграция при отказе
		// 1. Отключить аналитические сервисы (если они уже были загружены)
		// 2. Удалить аналитические cookies вручную (если требуется)
		// 3. Отправить отказ на бэкенд (если требуется хранение на сервере)
		//    await postCookieConsent({ isAccepted: false });
	};

	if (!isVisible) return null;

	return (
		<div className={block()}>
			<div className={element('content')}>
				<div className={element('text')}>
					<p className={element('message')}>
						Мы используем файлы cookie для улучшения работы сайта и персонализации контента. Продолжая использовать сайт, вы
						соглашаетесь с использованием cookie. Подробнее в{' '}
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
