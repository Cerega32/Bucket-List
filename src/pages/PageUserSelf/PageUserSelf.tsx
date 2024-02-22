import {FC} from 'react';

import {UserSelf} from '@/containers/UserSelf/UserSelf';
import {IPage} from '@/typings/page';

export const PageUserSelf: FC<IPage> = ({page, subPage}) => {
	return <UserSelf page={page} subPage={subPage as string} />;
};
