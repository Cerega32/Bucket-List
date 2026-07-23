import {FC, StrictMode} from 'react';
import {HelmetProvider} from 'react-helmet-async';

import Layout from '@/app/layout/Layout/Layout';
import {AppProviders} from '@/app/providers/AppProviders/AppProviders';
import {ErrorBoundary} from '@/app/providers/ErrorBoundary/ErrorBoundary';

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
