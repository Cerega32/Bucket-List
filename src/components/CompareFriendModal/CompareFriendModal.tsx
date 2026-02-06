import {FC} from 'react';

import {Avatar} from '@/components/Avatar/Avatar';
import {useBem} from '@/hooks/useBem';
import {IFriendCompareResponse} from '@/typings/user';

import {Line} from '../Line/Line';
import {Svg} from '../Svg/Svg';

import './compare-friend-modal.scss';

export function normalizeCompareResponse(raw: IFriendCompareResponse): CompareFriendData {
	const norm = (u: IFriendCompareResponse['user']) => ({
		id: u.id,
		username: u.username,
		firstName: u.firstName ?? u.first_name ?? '',
		lastName: u.lastName ?? u.last_name ?? '',
		avatar: u.avatar ?? null,
		activity: {
			goalsCompleted: u.activity.goalsCompleted ?? u.activity.goals_completed ?? 0,
			listsCompleted: u.activity.listsCompleted ?? u.activity.lists_completed ?? 0,
			totalCompleted: u.activity.totalCompleted ?? u.activity.total_completed ?? 0,
			latestCompletion: u.activity.latestCompletion ?? u.activity.latest_completion ?? null,
		},
	});
	return {
		user: norm(raw.user),
		friend: norm(raw.friend),
	};
}

export interface CompareActivity {
	goalsCompleted: number;
	listsCompleted: number;
	totalCompleted: number;
	latestCompletion: string | null;
}

export interface CompareUser {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	activity: CompareActivity;
	avatar?: string | null;
}

export interface CompareFriendData {
	user: CompareUser;
	friend: CompareUser;
}

const METRIC_KEYS: {key: keyof CompareActivity; label: string; formatDate?: boolean}[] = [
	{key: 'goalsCompleted', label: 'Выполнено целей'},
	{key: 'listsCompleted', label: 'Выполнено списков'},
	{key: 'totalCompleted', label: 'Всего выполнений'},
	{key: 'latestCompletion', label: 'Последнее выполнение', formatDate: true},
];

function formatDisplayValue(value: number | string | null, formatDate?: boolean): string {
	if (value === null || value === undefined) return '—';
	if (formatDate && typeof value === 'string') {
		try {
			const d = new Date(value);
			return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU');
		} catch {
			return '—';
		}
	}
	return String(value);
}

function getDisplayName(u: CompareUser): string {
	const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
	return name || u.username;
}

function getInitials(u: CompareUser): string {
	const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
	if (name) return name.charAt(0).toUpperCase();
	return u.username?.charAt(0).toUpperCase() || '?';
}

/** Подсветка: 'user' | 'friend' | null (равны) */
function getCellWinner(userVal: number | string | null, friendVal: number | string | null, formatDate?: boolean): 'user' | 'friend' | null {
	if (formatDate || typeof userVal === 'string' || typeof friendVal === 'string') return null;
	const u = Number(userVal);
	const f = Number(friendVal);
	if (Number.isNaN(u) || Number.isNaN(f)) return null;
	if (u > f) return 'user';
	if (f > u) return 'friend';
	return null;
}

interface CompareFriendModalProps {
	data: CompareFriendData;
}

export const CompareFriendModal: FC<CompareFriendModalProps> = ({data}) => {
	const [block, element] = useBem('compare-friend-modal');
	const {user, friend} = data;
	const friendName = getDisplayName(friend);

	// Итог: кто впереди по скольким показателям (считаем только числовые, без дат)
	const numericMetrics = METRIC_KEYS.filter((m) => !m.formatDate);
	let userWins = 0;
	let friendWins = 0;
	numericMetrics.forEach(({key}) => {
		const uv = user.activity[key] as number;
		const fv = friend.activity[key] as number;
		if (uv > fv) userWins += 1;
		else if (fv > uv) friendWins += 1;
	});
	const totalComparable = numericMetrics.length;

	return (
		<div className={block()}>
			<div className={element('section')}>
				<h2 className={element('header')}>Сравнение с {friendName}</h2>
			</div>

			<div className={element('participants')}>
				<div className={element('card')}>
					<div className={element('card-avatar')}>
						{user.avatar ? (
							<Avatar size="medium-56" avatar={user.avatar} />
						) : (
							<div className={element('initials')}>{getInitials(user)}</div>
						)}
					</div>
					<div className={element('card-name')}>{getDisplayName(user) || user.username}</div>
					<div className={element('card-meta')}>@{user.username}</div>
					<div className={element('card-row')}>
						<span className={element('card-label')}>Уровень</span>
						<span className={element('card-value')}>{user.activity.totalCompleted}</span>
					</div>
				</div>
				<div className={element('card')}>
					<div className={element('card-avatar')}>
						{friend.avatar ? (
							<Avatar size="medium-56" avatar={friend.avatar} />
						) : (
							<div className={element('initials')}>{getInitials(friend)}</div>
						)}
					</div>
					<div className={element('card-name')}>{friendName}</div>
					<div className={element('card-meta')}>@{friend.username}</div>
					<div className={element('card-row')}>
						<span className={element('card-label')}>Уровень</span>
						<span className={element('card-value')}>{friend.activity.totalCompleted}</span>
					</div>
				</div>
			</div>

			<div className={element('section')}>
				<div className={element('metrics-title')}>Показатели</div>
				<Line className={element('line')} margin="12px 0 16px" />
				<div className={element('metrics-header')}>
					<span className={element('metric-label')} />
					<div className={element('metric-cells')}>
						<span className={element('metric-cell', {header: true})}>Вы</span>
						<span className={element('metric-cell', {header: true})}>Друг</span>
					</div>
				</div>
				<div className={element('metrics')}>
					{METRIC_KEYS.map(({key, label, formatDate}) => {
						const userVal = user.activity[key] as number | string | null;
						const friendVal = friend.activity[key] as number | string | null;
						const winner = getCellWinner(userVal, friendVal, formatDate);
						return (
							<div key={key} className={element('metric-row')}>
								<span className={element('metric-label')}>{label}</span>
								<div className={element('metric-cells')}>
									<span
										className={element('metric-cell', {
											win: winner === 'user',
										})}
									>
										{winner === 'user' && <Svg icon="trophy" className={element('icon-win')} />}
										{formatDisplayValue(userVal, formatDate)}
									</span>
									<span
										className={element('metric-cell', {
											win: winner === 'friend',
										})}
									>
										{winner === 'friend' && <Svg icon="trophy" className={element('icon-win')} />}
										{formatDisplayValue(friendVal, formatDate)}
									</span>
								</div>
							</div>
						);
					})}
				</div>
				<Line className={element('line')} margin="16px 0 0" />
				<div className={element('summary')}>
					{userWins > friendWins && (
						<p className={element('summary-text', {you: true})}>
							Вы впереди по {userWins} из {totalComparable} показателей
						</p>
					)}
					{friendWins > userWins && (
						<p className={element('summary-text', {friend: true})}>
							Друг впереди по {friendWins} из {totalComparable} показателей
						</p>
					)}
					{userWins === friendWins && (
						<p className={element('summary-text', {equal: true})}>По {totalComparable} показателям ничья</p>
					)}
				</div>
			</div>
		</div>
	);
};
