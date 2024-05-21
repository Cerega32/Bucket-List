import {observer} from 'mobx-react';
import {FC, useEffect, useState} from 'react';

import {Achievement} from '@/components/Achievement/Achievement';
import {Button} from '@/components/Button/Button';
import {Card} from '@/components/Card/Card';
import {CatalogItems} from '@/components/CatalogItems/CatalogItems';
import {CommentsGoal} from '@/components/CommentsGoal/CommentsGoal';
import {Info100Goals} from '@/components/Info100Goals/Info100Goals';
import {ListGoals} from '@/components/ListGoals/ListGoals';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';
import {IAchievement} from '@/typings/achievements';
import {IComment} from '@/typings/comments';
import {IPage} from '@/typings/page';
import {getAddedGoals} from '@/utils/api/get/getAddedGoals';
import './user-self-goals.scss';
import {getAddedLists} from '@/utils/api/get/getAddedLists';
import {GET} from '@/utils/fetch/requests';
import {get100Goals} from '@/utils/api/get/get100Goals';
import {WeeklySchedule} from '@/components/WeeklySchedule/WeeklySchedule';
import {IGoal} from '@/typings/goal';

import Cookies from 'js-cookie';

interface UserSelfGoalsProps {
	subPage: string;
	completed: boolean;
}

export const UserSelfGoals: FC<UserSelfGoalsProps> = observer((props) => {
	const {subPage, completed} = props;

	const [block, element] = useBem('user-self-goals');

	return (
		<section className={block()}>
			<Title tag="h2" className={element('title')}>
				{completed ? 'Выполненные цели и списки' : 'Все активные цели и списки'}
			</Title>
			<CatalogItems
				userId={Cookies.get('user-id') as string}
				beginUrl={`/user/self/${completed ? 'done' : 'active'}-goals`}
				completed={completed}
				subPage={subPage}
				columns="3"
			/>
		</section>
	);
});
