import Cookies from 'js-cookie';
import {FC, useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';

import {EmptyState} from '@/components/EmptyState/EmptyState';
import {InfoGoal} from '@/components/InfoGoal/InfoGoal';
import {LeaderBoard} from '@/components/LeaderBoard/LeaderBoard';
import {LeaderPedestal} from '@/components/Leaders/LeaderPedestal';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {IInfoStats, IPreviousWeekLeaders, IWeekPeriod, IWeeklyLeader} from '@/typings/user';
import {getWeeklyLeaders} from '@/utils/api/get/getWeeklyLeaders';
import {defaultInfoStats} from '@/utils/data/default';

import {LeadersSkeleton} from './LeadersSkeleton';
import './leaders.scss';

type LeadersPeriod = 'current' | 'previous';

const parseLeadersPeriod = (value: string | null): LeadersPeriod => (value === 'previous' ? 'previous' : 'current');

const formatWeekRange = (start: string, end: string) => {
	const startDate = new Date(start);
	const endDate = new Date(end);
	const formatter = new Intl.DateTimeFormat('ru-RU', {day: 'numeric', month: 'long'});
	return `${formatter.format(startDate)} — ${formatter.format(endDate)}`;
};

export const Leaders: FC = () => {
	const [block, element] = useBem('leaders');
	const [searchParams, setSearchParams] = useSearchParams();
	const [leaders, setLeaders] = useState<Array<IWeeklyLeader>>([]);
	const [previousWeek, setPreviousWeek] = useState<IPreviousWeekLeaders | null>(null);
	const [currentPeriod, setCurrentPeriod] = useState<IWeekPeriod | null>(null);
	const [infoStats, setInfoStats] = useState<IInfoStats>(defaultInfoStats);
	const [isLoading, setIsLoading] = useState(true);
	const activePeriod = parseLeadersPeriod(searchParams.get('period'));
	const currentUserId = parseInt(Cookies.get('user-id') || '0', 10);

	const setActivePeriod = (period: LeadersPeriod) => {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				if (period === 'current') {
					next.delete('period');
				} else {
					next.set('period', period);
				}
				return next;
			},
			{replace: true}
		);
	};

	useEffect(() => {
		(async () => {
			setIsLoading(true);
			const response = await getWeeklyLeaders();
			if (response.success) {
				setLeaders(response.data.leaders);
				setPreviousWeek(response.data.previousWeek);
				setCurrentPeriod(response.data.period);
				setInfoStats(response.data.totalStats);
			}
			setIsLoading(false);
		})();
	}, []);

	const activeLeaders = activePeriod === 'current' ? leaders : previousWeek?.leaders ?? [];
	const showPedestal = activePeriod === 'current' && leaders.length > 0;
	const highlightUserId =
		currentUserId > 0
			? activePeriod === 'previous'
				? previousWeek?.currentUserPlace && previousWeek.currentUserPlace <= 10
					? currentUserId
					: undefined
				: currentUserId
			: undefined;
	const extraUser = activePeriod === 'previous' && currentUserId > 0 ? previousWeek?.currentUser : undefined;

	if (isLoading) {
		return <LeadersSkeleton className={block()} />;
	}

	return (
		<div className={block()}>
			<div className={element('intro')}>
				<Title className={element('title')} tag="h1">
					Лидеры недели
				</Title>
				<p className={element('description')}>
					Выполняйте цели, оставляйте впечатления, зарабатывайте очки и попадайте в число лучших пользователей за неделю.
					Соревнуйтесь с другими и зарабатывайте награды в свой профиль. Покажите всем, что вы живёте полной жизнью!
				</p>
				<p className={element('info-caption')}>Активность всех участников рейтинга за текущую неделю.</p>
				<InfoGoal
					items={[
						{title: 'Целей выполнено', value: infoStats.goalsCompleted},
						{title: 'Добавлено впечатлений', value: infoStats.reviewsAdded},
						{title: 'Опыта заработано', value: infoStats.experienceEarned},
					]}
					backgroundOff
				/>
			</div>
			{showPedestal && <LeaderPedestal users={leaders.slice(0, 3)} className={element('pedestal')} />}
			<div className={element('ranking')}>
				<div className={element('tabs')}>
					<button
						type="button"
						className={element('tab', {active: activePeriod === 'current'})}
						onClick={() => setActivePeriod('current')}
					>
						<span className={element('tab-label')}>Текущая неделя</span>
						{currentPeriod && (
							<span className={element('tab-range')}>{formatWeekRange(currentPeriod.start, currentPeriod.end)}</span>
						)}
					</button>
					<button
						type="button"
						className={element('tab', {active: activePeriod === 'previous'})}
						onClick={() => setActivePeriod('previous')}
					>
						<span className={element('tab-label')}>Прошлая неделя</span>
						{previousWeek && (
							<span className={element('tab-range')}>{formatWeekRange(previousWeek.start, previousWeek.end)}</span>
						)}
					</button>
				</div>
				{activeLeaders.length > 0 ? (
					<LeaderBoard
						className={element('board')}
						users={activeLeaders}
						highlightUserId={highlightUserId}
						extraUser={extraUser}
					/>
				) : (
					<EmptyState
						className={element('empty')}
						title={activePeriod === 'current' ? 'Лидер недели ещё не определён' : 'Рейтинг прошлой недели пуст'}
						description={
							activePeriod === 'current'
								? 'У вас есть шанс занять первое место'
								: 'На прошлой неделе никто не заработал очки в рейтинге'
						}
					/>
				)}
			</div>
		</div>
	);
};
