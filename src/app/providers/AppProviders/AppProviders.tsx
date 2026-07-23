import {FC} from 'react';

export const AppProviders: FC<{children: JSX.Element}> = ({children}) => (
	// eslint-disable-next-line react/jsx-no-useless-fragment
	<>{children}</>
);
