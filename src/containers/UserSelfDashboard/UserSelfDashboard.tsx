import {observer} from 'mobx-react';
import {FC, useEffect, useState} from 'react';

import {Achievement} from '@/components/Achievement/Achievement';
import {Button} from '@/components/Button/Button';
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
import './user-self-dashboard.scss';
import {getAddedLists} from '@/utils/api/get/getAddedLists';
import {GET} from '@/utils/fetch/requests';
import {get100Goals} from '@/utils/api/get/get100Goals';
import {WeeklySchedule} from '@/components/WeeklySchedule/WeeklySchedule';
import {IGoal} from '@/typings/goal';
import {Card} from '@/components/Card/Card';

interface UserSelfDashboardProps {}

export const UserSelfDashboard: FC<UserSelfDashboardProps> = observer(() => {
	const [block, element] = useBem('user-self-dashboard');

	const [goals, setGoals] = useState<Array<IGoal>>([]);

	return (
		<section className={block()}>
			<div className={element('info-wrapper')}>
				<div className={element('info')}>
					<h3 className={element('info-title')}>Активных целей в “100 целей”</h3>
					<span className={element('info-count')}>
						<Svg icon="star" />
						86
					</span>
				</div>
				<div className={element('info')}>
					<h3 className={element('info-title')}>Место в рейтинге недели</h3>
					<span className={element('info-count')}>
						<Svg icon="award" />
						86
					</span>
				</div>
				<div className={element('info')}>
					<h3 className={element('info-title')}>Активные цели и списки</h3>
					<p className={element('info-count-wrapper')}>
						<span className={element('info-count')}>
							<Svg icon="rocket" />
							26
						</span>
						<span className={element('info-count')}>
							<Svg icon="apps" />
							15
						</span>
					</p>
				</div>
				<Info100Goals
					totalAddedEasy={4}
					totalAddedHard={5}
					totalAddedMedium={5}
					totalCompletedEasy={2}
					totalCompletedHard={2}
					totalCompletedMedium={2}
					column
					className={element('info-100-goals')}
				/>
				<WeeklySchedule
					weeks={[
						{week: 48, month: 'Ян', count: 60},
						{week: 48, month: 'Ян', count: 1},
						{week: 48, month: 'Ян', count: 10},
						{week: 48, month: 'Ян', count: 45},
						{week: 48, month: 'Ян', count: 13},
						{week: 48, month: 'Ян', count: 56},
					]}
					className={element('weekly')}
				/>
			</div>
			<div className={element('title-wrapper')}>
				<Title className={element('title')} tag="h2">
					Можно выполнить сегодня
				</Title>
				<Button size="small" theme="blue-light" onClick={() => {}}>
					Показать другие
				</Button>
			</div>
			<>
				{goals.map((goal) => {
					<Card goal={goal} />;
				})}
			</>
		</section>
	);
});
