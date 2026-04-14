import {createRoot} from 'react-dom/client';

import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import 'yet-another-react-lightbox/styles.css';
import App from './containers/App/App';

(async () => {
	const root = document.getElementById('root')!;
	createRoot(root).render(<App />);
})();
