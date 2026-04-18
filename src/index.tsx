import {createRoot} from 'react-dom/client';

import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import 'yet-another-react-lightbox/styles.css';
import App from './containers/App/App';
import {initYandexMetrika} from './utils/analytics/yandexMetrika';

(async () => {
	if (import.meta.env.PROD) {
		initYandexMetrika(import.meta.env.VITE_YANDEX_METRIKA_ID ?? '');
	}

	const root = document.getElementById('root')!;
	createRoot(root).render(<App />);
})();
