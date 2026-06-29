import {FC, useEffect} from 'react';

import {ThemeStore} from '@/store/ThemeStore';
import {IPage} from '@/typings/page';

import {SubscriptionRefundContainer} from '../../containers/SubscriptionRefundContainer/SubscriptionRefundContainer';

export const PageSubscriptionRefund: FC<IPage> = ({page}) => {
	const {setHeader, setPage, setFull} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <SubscriptionRefundContainer />;
};
