import {createRoot} from 'react-dom/client';

import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import 'yet-another-react-lightbox/styles.css';
import App from './containers/App/App';
// Инициализация темы до первого рендера (синхронизация data-theme / localStorage)
import './store/ThemeModeStore';
import {initAnalyticsIfConsented} from './utils/legal/cookieConsent';

(async () => {
	initAnalyticsIfConsented();

	const root = document.getElementById('root');
	if (!root) {
		throw new Error('Root element not found');
	}

	createRoot(root).render(<App />);
})();
