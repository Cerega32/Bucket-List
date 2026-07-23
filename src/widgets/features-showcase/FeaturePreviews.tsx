import {FC, Fragment} from 'react';

import {CommentGoal} from '@/entities/comment/ui/CommentGoal/CommentGoal';
import {Card} from '@/entities/goal/ui/Card/Card';
import {CardMain} from '@/entities/goal/ui/CardMain/CardMain';
import {RegularCard} from '@/entities/regular-goal/ui/RegularCard/RegularCard';
import {CompareFriendModal} from '@/features/compare-friend/CompareFriendModal';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Svg} from '@/shared/ui/Svg/Svg';
import {
	COMING_SOON_ITEMS,
	DEMO_BOOK_GOAL,
	DEMO_CATALOG_LISTS,
	DEMO_COMMENT,
	DEMO_COMPARE_FRIEND,
	DEMO_HABIT_ITEMS,
	DEMO_HUNDRED_CARD_GOALS,
	DEMO_HUNDRED_GOALS,
	DEMO_ORGANIZE_GOALS,
	DEMO_PROGRESS_ENTRIES,
	DEMO_SHOWCASE_FOLDERS,
	ShowcaseScenarioId,
} from '@/widgets/features-showcase/features-showcase-data';
import {GoalFoldersShowcase} from '@/widgets/features-showcase/GoalFoldersShowcase';
import {ShowcaseMapsSlideshow} from '@/widgets/features-showcase/ShowcaseMapsSlideshow';
import {ShowcaseUserSelfDashboard} from '@/widgets/features-showcase/ShowcaseUserSelfDashboard';
import {Info100Goals} from '@/widgets/info-100-goals/Info100Goals';

import '@/widgets/features-showcase/features-showcase.scss';

const noop = async () => undefined;

interface FeaturePreviewsProps {
	scenarioId: ShowcaseScenarioId;
}

export const FeaturePreviews: FC<FeaturePreviewsProps> = (props) => {
	const {scenarioId} = props;
	const [, element] = useBem('features-showcase');

	switch (scenarioId) {
		case 'organize':
			return (
				<>
					{DEMO_ORGANIZE_GOALS.map((goal) => (
						<Card
							key={goal.code}
							goal={goal}
							onClickAdd={noop}
							onClickDelete={noop}
							onClickMark={noop}
							disableNavigation
							disableMark
							hideActions
						/>
					))}
				</>
			);

		case 'folders':
			return (
				<>
					<div className={element('folders-personal')}>
						<p className={element('section-label')}>Твои папки</p>
						<p className={element('section-hint')}>Личная сортировка — только твои цели, не видны другим</p>
						<GoalFoldersShowcase folders={DEMO_SHOWCASE_FOLDERS} activeFolderId={1} className={element('folder-manager')} />
					</div>
					<div className={element('folders-catalog')}>
						<p className={element('section-label')}>Списки из каталога</p>
						<p className={element('section-hint')}>Публичные подборки целей — готовые наборы от платформы и сообщества</p>
						<div className={element('demo-folder-lists')}>
							{DEMO_CATALOG_LISTS.map((list) => (
								<Card
									key={list.code}
									isList
									goal={list}
									onClickAdd={noop}
									onClickDelete={noop}
									disableNavigation
									disableMark
									hideActions
								/>
							))}
						</div>
					</div>
				</>
			);

		case 'hundred':
			return (
				<>
					<Info100Goals
						className={element('hundred-stats')}
						totalAddedEasy={DEMO_HUNDRED_GOALS.totalAddedEasy}
						totalAddedMedium={DEMO_HUNDRED_GOALS.totalAddedMedium}
						totalAddedHard={DEMO_HUNDRED_GOALS.totalAddedHard}
						totalCompletedEasy={DEMO_HUNDRED_GOALS.totalCompletedEasy}
						totalCompletedMedium={DEMO_HUNDRED_GOALS.totalCompletedMedium}
						totalCompletedHard={DEMO_HUNDRED_GOALS.totalCompletedHard}
					/>
					{DEMO_HUNDRED_CARD_GOALS.map((goal, index) => (
						<CardMain
							key={goal.code}
							className={element('demo-hundred-card', {hideMd: index === 0, completed: goal.completedByUser})}
							goal={goal}
							disableNavigation
							topInfoClassName="gradient__top-info--main-goals"
						/>
					))}
				</>
			);

		case 'friends':
			return <CompareFriendModal className={element('demo-compare')} data={DEMO_COMPARE_FRIEND} showcase hideResult />;

		case 'goalProgress':
			return (
				<>
					<CardMain
						className={element('demo-progress-card')}
						goal={DEMO_BOOK_GOAL}
						disableNavigation
						topInfoClassName="gradient__top-info--main-goals"
					/>
					<ul className={element('demo-progress-list')}>
						{DEMO_PROGRESS_ENTRIES.map((entry) => (
							<li key={entry.id} className={element('demo-progress-entry')}>
								<span className={element('demo-progress-date')}>{entry.date.split('-').reverse().join('.')}</span>
								<div className={element('demo-progress-note')}>{entry.notes}</div>
								<span className={element('demo-progress-badge')}>+{entry.percentageChange}%</span>
							</li>
						))}
					</ul>
				</>
			);

		case 'habits':
			return (
				<>
					{DEMO_HABIT_ITEMS.map((item) => (
						<RegularCard
							key={item.goal.code}
							className={element('demo-habit-card')}
							regularGoal={item.goal}
							statistics={item.statistics}
							onMarkRegular={() => undefined}
						/>
					))}
				</>
			);

		case 'travel':
			return <ShowcaseMapsSlideshow className={element('maps-slideshow')} />;

		case 'impressions':
			return <CommentGoal comment={DEMO_COMMENT} isUser hideReport />;

		case 'dashboard':
			return <ShowcaseUserSelfDashboard className={element('user-dashboard')} />;

		case 'roadmap':
			return (
				<ul className={element('roadmap-preview-list')}>
					{COMING_SOON_ITEMS.map((item) => (
						<li key={item.title} className={element('roadmap-preview-item')}>
							<span className={element('roadmap-item-icon', {red: item.iconAccent === 'red'})}>
								<Svg icon={item.icon} width="20px" height="20px" />
							</span>
							<span className={element('roadmap-item-body')}>
								<span className={element('roadmap-preview-title')}>{item.title}</span>
								<span className={element('roadmap-item-desc')}>{item.description}</span>
							</span>
						</li>
					))}
				</ul>
			);

		default:
			return null;
	}
};
