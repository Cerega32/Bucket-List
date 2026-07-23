import {FC, useEffect} from 'react';

import {ThemeStore} from '@/shared/model/ThemeStore';
import {IPage} from '@/shared/types/page';
import {CookiesContainer} from '@/widgets/cookies-policy/CookiesContainer';

export const PageCookies: FC<IPage> = ({page}) => {
	const {setHeader, setPage, setFull} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <CookiesContainer />;
};
