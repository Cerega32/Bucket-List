import {FC} from 'react';
import {IPage} from '@/typings/page';
import {NotFound} from '@/containers/NotFound/NotFound';

export const PageNotFound: FC<IPage> = () => {
	return <NotFound />;
};
