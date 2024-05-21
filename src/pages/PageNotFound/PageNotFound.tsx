import {FC} from 'react';

import {NotFound} from '@/containers/NotFound/NotFound';
import {IPage} from '@/typings/page';

export const PageNotFound: FC<IPage> = () => {
	return <NotFound />;
};
