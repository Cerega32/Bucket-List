import {createRoot} from 'react-dom/client';

import 'yet-another-react-lightbox/styles.css';
import App from './containers/App/App';

(async () => {
	const root = document.getElementById('root')!;
	createRoot(root).render(<App />);
})();
