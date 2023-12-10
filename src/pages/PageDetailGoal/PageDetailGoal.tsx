import {FC} from 'react';
import {Goal} from '@/containers/Goal/Goal';
import {IPage} from '@/typings/page';

export const PageDetailGoal: FC<IPage> = ({page}) => {
	return <Goal page={page} />;
};
