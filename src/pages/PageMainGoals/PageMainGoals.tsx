import {FC} from 'react';

import {MainGoals} from '@/containers/MainGoals/MainGoals';
import {IPage} from '@/typings/page';

export const PageMainGoals: FC<IPage> = ({page}) => {
	return <MainGoals page={page} />;
};
