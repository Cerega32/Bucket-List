import {createRoot} from 'react-dom/client';

import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import 'yet-another-react-lightbox/styles.css';
import App from '@/app/App/App';
// Регистрация хендлеров HTTP-клиента (инверсия зависимостей shared → entities) до первого запроса
import '@/app/model/httpInterceptors';
// Инициализация темы до первого рендера (синхронизация data-theme / localStorage)
import '@/shared/model/ThemeModeStore';
import {initAnalyticsIfConsented} from '@/shared/config/legal/cookieConsent';

(async () => {
	initAnalyticsIfConsented();

	const root = document.getElementById('root');
	if (!root) {
		throw new Error('Root element not found');
	}

	createRoot(root).render(<App />);
})();
