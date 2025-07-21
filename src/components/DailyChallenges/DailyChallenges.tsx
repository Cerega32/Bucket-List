import React, {useEffect, useState} from 'react';

import {Progress} from '@/components/Progress/Progress';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {
	DIFFICULTY_COLORS,
	DIFFICULTY_LABELS,
	IDailyChallenge,
	IWeeklyChallenge,
	IWeeklyChallengeItem,
	getCurrentWeekChallenge,
} from '@/utils/api/challenges';
import './daily-challenges.scss';

interface IDailyChallengesProps {
	compact?: boolean;
	showHeader?: boolean;
	className?: string;
}

export const DailyChallenges: React.FC<IDailyChallengesProps> = ({compact = false, showHeader = true, className}) => {
	const [block, element] = useBem('daily-challenges', className);
	const [weeklyChallenge, setWeeklyChallenge] = useState<IWeeklyChallenge | null>(null);
	const [challengeItems, setChallengeItems] = useState<IWeeklyChallengeItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const loadChallenges = async () => {
		try {
			const response = await getCurrentWeekChallenge();
			if (response.success && response.data) {
				setWeeklyChallenge(response.data.weeklyChallenge);
				setChallengeItems(response.data.challengeItems || []);
			}
		} catch (error) {
			console.error('Ошибка загрузки заданий:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadChallenges();

		// Обновляем каждые 30 секунд
		const interval = setInterval(loadChallenges, 30000);
		return () => clearInterval(interval);
	}, []);

	const getWeekProgress = () => {
		if (!weeklyChallenge || challengeItems.length === 0) return 0;
		return (weeklyChallenge.completedChallenges / challengeItems.length) * 100;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
		});
	};

	const getChallengeIcon = (challengeType: string) => {
		const iconMap: Record<string, string> = {
			complete_goals: 'check-circle',
			add_goals: 'plus-circle',
			comment_goals: 'message-circle',
			visit_profiles: 'users',
			login_streak: 'calendar',
			update_progress: 'trending-up',
			create_folder: 'folder',
			share_goal: 'share',
			like_comments: 'heart',
			daily_goal_complete: 'target',
		};
		return iconMap[challengeType] || 'star';
	};

	if (isLoading) {
		return (
			<div className={block({compact})}>
				<div className={element('loading')}>
					<Svg icon="loader" className={element('loading-icon')} />
					<span>Загрузка заданий...</span>
				</div>
			</div>
		);
	}

	if (!weeklyChallenge) {
		return (
			<div className={block({compact})}>
				<div className={element('empty')}>
					<Svg icon="calendar" className={element('empty-icon')} />
					<p className={element('empty-text')}>Задания на эту неделю не найдены</p>
				</div>
			</div>
		);
	}

	return (
		<div className={block({compact})}>
			{showHeader && (
				<div className={element('header')}>
					<div className={element('header-info')}>
						<h3 className={element('title')}>Задания недели</h3>
						<p className={element('week-period')}>
							{formatDate(weeklyChallenge.weekStart)} - {formatDate(weeklyChallenge.weekEnd)}
						</p>
					</div>

					<div className={element('week-stats')}>
						<div className={element('experience')}>
							<Svg icon="zap" className={element('experience-icon')} />
							<span className={element('experience-value')}>{weeklyChallenge.totalExperience} XP</span>
						</div>

						{weeklyChallenge.bonusEarned && (
							<div className={element('bonus-badge')}>
								<Svg icon="award" />
								<span>Бонус получен!</span>
							</div>
						)}
					</div>
				</div>
			)}

			<div className={element('progress-section')}>
				<div className={element('progress-header')}>
					<span className={element('progress-label')}>
						Прогресс недели: {weeklyChallenge.completedChallenges}/{challengeItems.length}
					</span>
					<span className={element('progress-percentage')}>{Math.round(getWeekProgress())}%</span>
				</div>
				<Progress done={getWeekProgress()} all={100} className={element('progress-bar')} />
			</div>

			<div className={element('challenges')}>
				{challengeItems.map((item) => {
					const challenge = item.dailyChallenge as any as IDailyChallenge;
					const progressPercentage = Math.min(100, (item.currentProgress / challenge.targetValue) * 100);

					return (
						<div
							key={item.id}
							className={element('challenge', {
								completed: item.isCompleted,
								compact,
							})}
						>
							<div className={element('challenge-icon')}>
								<Svg icon={getChallengeIcon(challenge.challengeType)} className={element('challenge-icon-svg')} />
							</div>

							<div className={element('challenge-content')}>
								<div className={element('challenge-header')}>
									<h4 className={element('challenge-title')}>{challenge.title}</h4>
									<div className={element('challenge-badges')}>
										<span
											className={element('difficulty-badge')}
											style={{
												backgroundColor: DIFFICULTY_COLORS[challenge.difficulty],
												color: 'white',
											}}
										>
											{DIFFICULTY_LABELS[challenge.difficulty]}
										</span>
										{item.isCompleted && (
											<span className={element('completed-badge')}>
												<Svg icon="check" />
												Выполнено
											</span>
										)}
									</div>
								</div>

								{!compact && <p className={element('challenge-description')}>{challenge.description}</p>}

								<div className={element('challenge-progress')}>
									<div className={element('progress-info')}>
										<span className={element('progress-text')}>
											{item.currentProgress}/{challenge.targetValue}
										</span>
										<span className={element('reward-text')}>+{challenge.experienceReward} XP</span>
									</div>
									<Progress done={progressPercentage} all={100} className={element('challenge-progress-bar')} />
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{!compact && challengeItems.length > 0 && (
				<div className={element('footer')}>
					<div className={element('footer-info')}>
						<Svg icon="info" className={element('info-icon')} />
						<span className={element('footer-text')}>Выполните все задания, чтобы получить бонусный опыт!</span>
					</div>
				</div>
			)}
		</div>
	);
};
