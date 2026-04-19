import {FC, useCallback, useRef} from 'react';

import {Avatar} from '@/components/Avatar/Avatar';
import {useBem} from '@/hooks/useBem';
import {ICompareAchievement, ICompareActivity, ICompareCategory, ICompareUser, IFriendCompareResponse} from '@/typings/user';

import {Svg} from '../Svg/Svg';

import './compare-friend-modal.scss';

const DEFAULT_ACTIVITY: ICompareActivity = {
	goalsCompleted: 0,
	goalsByCategory: [],
	listsCompleted: 0,
	commentsCount: 0,
	totalLikes: 0,
	locationsVisited: 0,
	achievementIds: [],
	regularCompleted: 0,
	bestWeeklyRank: null,
	hundredGoals: {easy: 0, medium: 0, hard: 0},
	siteActivity: {activeDays: 0, activityPercentage: 0},
};

function safeActivity(act: Partial<ICompareActivity> | undefined): ICompareActivity {
	if (!act) return {...DEFAULT_ACTIVITY};
	return {
		goalsCompleted: act.goalsCompleted ?? 0,
		goalsByCategory: act.goalsByCategory ?? [],
		listsCompleted: act.listsCompleted ?? 0,
		commentsCount: act.commentsCount ?? 0,
		totalLikes: act.totalLikes ?? 0,
		locationsVisited: act.locationsVisited ?? 0,
		achievementIds: act.achievementIds ?? [],
		regularCompleted: act.regularCompleted ?? 0,
		bestWeeklyRank: act.bestWeeklyRank ?? null,
		hundredGoals: act.hundredGoals ?? {easy: 0, medium: 0, hard: 0},
		siteActivity: act.siteActivity ?? {activeDays: 0, activityPercentage: 0},
	};
}

/** Нормализация ответа API */
export function normalizeCompareResponse(raw: IFriendCompareResponse): CompareFriendData {
	return {
		user: {...raw.user, activity: safeActivity(raw.user.activity)},
		friend: {...raw.friend, activity: safeActivity(raw.friend.activity)},
		achievements: raw.achievements || [],
	};
}

export interface CompareFriendData {
	user: ICompareUser;
	friend: ICompareUser;
	achievements: ICompareAchievement[];
}

interface SubRow {
	label: string;
	userVal: number | string;
	friendVal: number | string;
	isChild?: boolean;
}

interface MetricSection {
	icon: string;
	iconColor?: string;
	label: string;
	userVal: number | string;
	friendVal: number | string;
	invertWin?: boolean;
	rows?: SubRow[];
}

function getInitials(u: ICompareUser): string {
	const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
	if (name) return name.charAt(0).toUpperCase();
	return u.username?.charAt(0).toUpperCase() || '?';
}

interface ParentEntry {
	name: string;
	userCount: number;
	friendCount: number;
	userSubs: Record<number, {name: string; count: number}>;
	friendSubs: Record<number, {name: string; count: number}>;
}

function mergeCategories(userCats: ICompareCategory[], friendCats: ICompareCategory[]): SubRow[] {
	const parentMap: Record<number, ParentEntry> = {};

	const getOrCreate = (id: number, name: string): ParentEntry => {
		if (!parentMap[id]) {
			parentMap[id] = {name, userCount: 0, friendCount: 0, userSubs: {}, friendSubs: {}};
		}
		return parentMap[id];
	};

	(userCats || []).forEach((cat) => {
		const entry = getOrCreate(cat.id, cat.name);
		entry.userCount = cat.count;
		(cat.subcategories || []).forEach((sub) => {
			entry.userSubs[sub.id] = {name: sub.name, count: sub.count};
		});
	});

	(friendCats || []).forEach((cat) => {
		const entry = getOrCreate(cat.id, cat.name);
		entry.friendCount = cat.count;
		(cat.subcategories || []).forEach((sub) => {
			entry.friendSubs[sub.id] = {name: sub.name, count: sub.count};
		});
	});

	return Object.values(parentMap)
		.sort((a, b) => b.userCount + b.friendCount - (a.userCount + a.friendCount))
		.flatMap((cat) => {
			const parent: SubRow = {label: cat.name, userVal: cat.userCount, friendVal: cat.friendCount};

			const allSubIds = new Set([...Object.keys(cat.userSubs).map(Number), ...Object.keys(cat.friendSubs).map(Number)]);

			const children: SubRow[] = Array.from(allSubIds)
				.map((id) => ({
					label: cat.userSubs[id]?.name || cat.friendSubs[id]?.name || '',
					userVal: cat.userSubs[id]?.count || 0,
					friendVal: cat.friendSubs[id]?.count || 0,
					isChild: true,
				}))
				.sort((a, b) => (b.userVal as number) + (b.friendVal as number) - (a.userVal as number) - (a.friendVal as number));

			return [parent, ...children];
		});
}

function getWinner(uv: number, fv: number, invert?: boolean): {userWin: boolean; friendWin: boolean} {
	if (invert) {
		return {
			userWin: uv > 0 && fv > 0 ? uv < fv : uv > 0,
			friendWin: uv > 0 && fv > 0 ? fv < uv : fv > 0,
		};
	}
	return {userWin: uv > fv, friendWin: fv > uv};
}

const ICON_SIZE = '20px';

interface CompareFriendModalProps {
	data: CompareFriendData;
}

export const CompareFriendModal: FC<CompareFriendModalProps> = ({data}) => {
	const [block, element] = useBem('compare-friend-modal');
	const {user, friend, achievements} = data;

	const headRef = useRef<HTMLDivElement>(null);
	const handleGridScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		if (headRef.current) {
			headRef.current.scrollLeft = e.currentTarget.scrollLeft;
		}
	}, []);

	const uAct = user.activity;
	const fAct = friend.activity;

	const categoryRows = mergeCategories(uAct.goalsByCategory, fAct.goalsByCategory);

	// Фильтруем достижения — показываем только те, которые есть хотя бы у одного
	const visibleAchievements = achievements.filter((a) => a.userHas || a.friendHas);
	const userAchCount = visibleAchievements.filter((a) => a.userHas).length;
	const friendAchCount = visibleAchievements.filter((a) => a.friendHas).length;

	const sections: MetricSection[] = [
		{
			icon: 'bullseye',
			iconColor: 'var(--color-sentiment-negative)',
			label: 'Выполнено целей',
			userVal: uAct.goalsCompleted,
			friendVal: fAct.goalsCompleted,
			rows: categoryRows,
		},
		{icon: 'apps', label: 'Выполнено списков', userVal: uAct.listsCompleted, friendVal: fAct.listsCompleted},
		{
			icon: 'comment',
			iconColor: 'var(--color-sentiment-positive)',
			label: 'Впечатлений к целям',
			userVal: uAct.commentsCount,
			friendVal: fAct.commentsCount,
		},
		{
			icon: 'like',
			iconColor: 'var(--color-sentiment-negative)',
			label: 'Лайков на моих впечатлениях',
			userVal: uAct.totalLikes,
			friendVal: fAct.totalLikes,
		},
		{icon: 'map', label: 'Посещённые локации', userVal: uAct.locationsVisited, friendVal: fAct.locationsVisited},
		{
			icon: 'regular-empty',
			label: 'Регулярных целей выполнено',
			userVal: uAct.regularCompleted,
			friendVal: fAct.regularCompleted,
		},
		{
			icon: 'medal',
			label: 'Место в рейтинге недели',
			userVal: uAct.bestWeeklyRank || 0,
			friendVal: fAct.bestWeeklyRank || 0,
			invertWin: true,
		},
		{
			icon: 'rocket',
			label: 'Выполнено из 100 целей',
			userVal: uAct.hundredGoals.easy + uAct.hundredGoals.medium + uAct.hundredGoals.hard,
			friendVal: fAct.hundredGoals.easy + fAct.hundredGoals.medium + fAct.hundredGoals.hard,
			rows: [
				{label: 'Лёгкие', userVal: uAct.hundredGoals.easy, friendVal: fAct.hundredGoals.easy},
				{label: 'Средние', userVal: uAct.hundredGoals.medium, friendVal: fAct.hundredGoals.medium},
				{label: 'Сложные', userVal: uAct.hundredGoals.hard, friendVal: fAct.hundredGoals.hard},
			],
		},
		{
			icon: 'signal',
			iconColor: 'var(--color-orange-2)',
			label: 'Активность на сайте (дней)',
			userVal: uAct.siteActivity.activeDays,
			friendVal: fAct.siteActivity.activeDays,
		},
	];

	// Подсчёт побед
	const {userWins: sectionUserWins, friendWins: sectionFriendWins} = sections.reduce(
		(acc, s) => {
			const uNum = typeof s.userVal === 'number' ? s.userVal : 0;
			const fNum = typeof s.friendVal === 'number' ? s.friendVal : 0;
			if (s.label === 'Активность на сайте') {
				if (uAct.siteActivity.activeDays > fAct.siteActivity.activeDays) acc.userWins += 1;
				else if (fAct.siteActivity.activeDays > uAct.siteActivity.activeDays) acc.friendWins += 1;
			} else {
				const w = getWinner(uNum, fNum, s.invertWin);
				if (w.userWin) acc.userWins += 1;
				if (w.friendWin) acc.friendWins += 1;
			}
			return acc;
		},
		{userWins: 0, friendWins: 0}
	);
	let userWins = sectionUserWins;
	let friendWins = sectionFriendWins;
	if (userAchCount > friendAchCount) userWins += 1;
	else if (friendAchCount > userAchCount) friendWins += 1;

	const totalMetrics = sections.length + 1;

	const renderValueCell = (val: number | string, win: boolean) => (
		<span className={element('val')}>
			<span className={element('val-inner', {win})}>
				{win ? (
					<Svg icon="trophy" width="14px" height="14px" className={element('trophy')} />
				) : (
					<span className={element('trophy-spacer')} />
				)}
				<span className={element('val-number')}>{typeof val === 'number' ? String(val) : val || '—'}</span>
			</span>
		</span>
	);

	return (
		<div className={block()}>
			<div className={element('header')}>
				<div className={element('player')}>
					<div className={element('avatar-wrap')}>
						{user.avatar ? (
							<Avatar size="medium-56" avatar={user.avatar} noBorder />
						) : (
							<div className={element('initials')}>{getInitials(user)}</div>
						)}
					</div>
					<span className={element('name')}>{user.username}</span>
					<span className={element('badge')}>Уровень {user.level}</span>
				</div>

				<div className={element('vs')}>VS</div>

				<div className={element('player')}>
					<div className={element('avatar-wrap')}>
						{friend.avatar ? (
							<Avatar size="medium-56" avatar={friend.avatar} noBorder />
						) : (
							<div className={element('initials')}>{getInitials(friend)}</div>
						)}
					</div>
					<span className={element('name')}>{friend.username}</span>
					<span className={element('badge')}>Уровень {friend.level}</span>
				</div>
			</div>

			<div className={element('grid-head')} ref={headRef}>
				<span className={element('col-label')}>Показатель</span>
				<span className={element('col-val')}>Вы</span>
				<span className={element('col-val')}>Друг</span>
			</div>
			<div className={element('grid')} onScroll={handleGridScroll}>
				<div className={element('grid-inner')}>
					{sections.map((s) => {
						const uNum = typeof s.userVal === 'number' ? s.userVal : 0;
						const fNum = typeof s.friendVal === 'number' ? s.friendVal : 0;
						let mainWin = {userWin: false, friendWin: false};
						if (s.label === 'Активность на сайте') {
							mainWin = getWinner(uAct.siteActivity.activeDays, fAct.siteActivity.activeDays);
						} else {
							mainWin = getWinner(uNum, fNum, s.invertWin);
						}

						return (
							<div key={s.label} className={element('section')}>
								<div className={element('row')}>
									<span className={element('col-label')}>
										<span
											className={element('icon', {colored: !!s.iconColor})}
											style={s.iconColor ? {color: s.iconColor} : undefined}
										>
											<Svg icon={s.icon} width={ICON_SIZE} height={ICON_SIZE} />
										</span>
										{s.label}
									</span>
									{renderValueCell(s.userVal, mainWin.userWin)}
									{renderValueCell(s.friendVal, mainWin.friendWin)}
								</div>
								{s.rows &&
									s.rows.map((sub) => {
										const subWin = getWinner(sub.userVal as number, sub.friendVal as number);
										return (
											<div key={sub.label} className={element('row', {sub: !sub.isChild, child: !!sub.isChild})}>
												<span className={element('col-label', {sub: !sub.isChild, child: !!sub.isChild})}>
													{sub.label}
												</span>
												{renderValueCell(sub.userVal, subWin.userWin)}
												{renderValueCell(sub.friendVal, subWin.friendWin)}
											</div>
										);
									})}
							</div>
						);
					})}

					<div className={element('section')}>
						<div className={element('row')}>
							<span className={element('col-label')}>
								<Svg icon="award" width={ICON_SIZE} height={ICON_SIZE} className={element('icon')} />
								Достижения
							</span>
							{renderValueCell(userAchCount, userAchCount > friendAchCount)}
							{renderValueCell(friendAchCount, friendAchCount > userAchCount)}
						</div>
						{visibleAchievements.map((ach) => (
							<div key={ach.id} className={element('row', {ach: true})}>
								<span className={element('col-label', {sub: true})}>
									{ach.isSecret && !ach.title ? 'Секретное достижение' : ach.title}
								</span>
								<span className={element('val')}>
									{ach.image ? (
										<img src={ach.image} alt="" className={element('ach-img', {off: !ach.userHas})} />
									) : (
										<Svg icon="award" width="28px" height="28px" className={element('ach-svg', {off: !ach.userHas})} />
									)}
								</span>
								<span className={element('val')}>
									{ach.image ? (
										<img src={ach.image} alt="" className={element('ach-img', {off: !ach.friendHas})} />
									) : (
										<Svg
											icon="award"
											width="28px"
											height="28px"
											className={element('ach-svg', {off: !ach.friendHas})}
										/>
									)}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Итог */}
			<div className={element('result')}>
				{userWins > friendWins && (
					<div className={element('result-badge', {you: true})}>
						<Svg icon="trophy" width="24px" height="24px" className={element('result-icon')} />
						Вы впереди по {userWins} из {totalMetrics} показателей
					</div>
				)}
				{friendWins > userWins && (
					<div className={element('result-badge', {friend: true})}>
						<Svg icon="trophy" width="24px" height="24px" className={element('result-icon')} />
						Друг впереди по {friendWins} из {totalMetrics} показателей
					</div>
				)}
				{userWins === friendWins && (
					<div className={element('result-badge', {equal: true})}>Ничья — {totalMetrics} показателей</div>
				)}
			</div>
		</div>
	);
};
