import {FC, StrictMode} from 'react';
import {ErrorBoundary} from '../ErrorBoundary/ErrorBoundary';
import {AppProviders} from '../AppProviders/AppProviders';
import Layout from '../Layout/Layout';

const App: FC = () => {
	return (
		<StrictMode>
			<AppProviders>
				<ErrorBoundary>
					<Layout />
				</ErrorBoundary>
			</AppProviders>
		</StrictMode>
	);
};

export default App;
