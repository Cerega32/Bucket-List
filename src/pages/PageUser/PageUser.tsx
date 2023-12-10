import {FC} from 'react';
import {User} from '@/containers/User/User';
import {IPage} from '@/typings/page';

export const PageUser: FC<IPage> = ({page}) => {
	return <User page={page} />;
};
