import {FC} from 'react';

import {User} from '@/containers/User/User';
import {IPage} from '@/typings/page';

export const PageUser: FC<IPage> = ({page, subPage}) => {
	return <User page={page} subPage={subPage as string} />;
};
