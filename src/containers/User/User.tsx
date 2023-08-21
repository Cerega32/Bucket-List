import {FC, useEffect} from 'react';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '@/store/ThemeStore';
import './user.scss';

export const User: FC = () => {
	const [block, element] = useBem('user');

	const {setHeader} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <main className={block()}>Hello</main>;
};
