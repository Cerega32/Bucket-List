import {FC, StrictMode} from 'react';
import {ErrorBoundary} from '../ErrorBoundary/ErrorBoundary';
import {AppProviders} from '../AppProviders/AppProviders';
import {RoutesAuth} from '../RoutesAuth/RoutesAuth';

import '../../_commons/styles-supports/scaffolding.scss';
import {Header} from '@/components/Header/Header';

const App: FC = () => {
	return (
		<StrictMode>
			<AppProviders>
				<ErrorBoundary>
					<>
						<Header />
						<RoutesAuth />
					</>
				</ErrorBoundary>
			</AppProviders>
		</StrictMode>
	);
};

export default App;
