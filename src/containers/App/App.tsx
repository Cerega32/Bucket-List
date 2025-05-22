import {FC, StrictMode} from 'react';
import {HelmetProvider} from 'react-helmet-async';

import {AppProviders} from '../AppProviders/AppProviders';
import {ErrorBoundary} from '../ErrorBoundary/ErrorBoundary';
import Layout from '../Layout/Layout';

const App: FC = () => {
	return (
		<StrictMode>
			<AppProviders>
				<ErrorBoundary>
					<HelmetProvider>
						<Layout />
					</HelmetProvider>
				</ErrorBoundary>
			</AppProviders>
		</StrictMode>
	);
};

export default App;
