import {FC, useState} from 'react';
import './app.scss';

interface AppProps {
	className?: string;
}

export const App: FC<AppProps> = () => {
	const [loader] = useState('fdghj');

	return <div className="app">{loader}</div>;
};
