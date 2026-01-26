import {observer} from 'mobx-react-lite';
import {FC, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {scroller} from 'react-scroll';

import './content-goal.scss';

import {useBem} from '@/hooks/useBem';
import {GoalStore} from '@/store/GoalStore';
import {IGoal} from '@/typings/goal';
import {getComments} from '@/utils/api/get/getComments';

import {Button} from '../Button/Button';
import {CommentsGoal} from '../CommentsGoal/CommentsGoal';
import {DescriptionWithLinks} from '../DescriptionWithLinks/DescriptionWithLinks';
import {ListsWithGoal} from '../ListsWithGoal/ListsWithGoal';
import {RegularGoalHistory} from '../RegularGoalHistory/RegularGoalHistory';
import {RegularGoalRating} from '../RegularGoalRating/RegularGoalRating';
import {Svg} from '../Svg/Svg';

interface ContentGoalProps {
	className?: string;
	goal: IGoal;
	page: string;
	historyRefreshTrigger?: number; // Триггер для обновления истории выполнения
}

export const ContentGoal: FC<ContentGoalProps> = observer((props) => {
	const {className, goal, page, historyRefreshTrigger} = props;

	const [block, element] = useBem('content-goal', className);
	const navigate = useNavigate();

	const {comments, setComments, setInfoPaginationComments} = GoalStore;

	useEffect(() => {
		if (page === 'isGoal') {
			(async () => {
				const res = await getComments(goal.code);

				if (res.success) {
					setComments(res.data.data);
					setInfoPaginationComments(res.data.pagination);
				}
			})();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [goal.code, page]);

	const getGoalContent = () => {
		switch (page) {
			case 'isGoal':
				return <CommentsGoal comments={comments} setComments={setComments} />;
			case 'isGoalLists':
				return <ListsWithGoal code={goal.code} />;
			case 'isGoalHistory':
				// Показываем историю только если цель регулярная и добавлена пользователем
				if (goal.regularConfig && goal.addedByUser && goal.regularConfig.id) {
					return (
						<RegularGoalHistory
							regularGoalId={goal.regularConfig.id}
							refreshTrigger={historyRefreshTrigger}
							allowCustomSettings={goal.regularConfig.allowCustomSettings}
						/>
					);
				}
				return null;
			case 'isGoalRating':
				// Показываем рейтинг только если цель регулярная, бессрочная и добавлена пользователем
				if (goal.regularConfig && goal.addedByUser && goal.regularConfig.id && goal.regularConfig.durationType === 'indefinite') {
					return <RegularGoalRating regularGoalId={goal.regularConfig.id} />;
				}
				return null;
			default:
				return null;
		}
	};

	const scrollToComments = () => {
		navigate(`/goals/${goal.code}/lists`);
		scroller.scrollTo('comments-section', {
			duration: 800,
			delay: 0,
			smooth: 'easeInOutQuart',
			offset: -50,
		});
	};

	return (
		<article className={block()}>
			{goal.addedFromList && goal.addedFromList.length > 0 && (
				<div className={element('goal-in-list')}>
					<Svg icon="info" />
					Цель включена в список и отображается вместе с ним
					<Button className={element('goal-in-list-btn')} theme="no-border" type="button" onClick={scrollToComments}>
						Смотреть списки
					</Button>
				</div>
			)}
			<DescriptionWithLinks goal={goal} page={page} />
			<section className={element('comments')} id="comments-section">
				{/* <Title tag="h2" className={element('title-section')}>
					Отметки выполнения&nbsp;
					<span className={element('title-counter')}>256</span>
				</Title> */}
				{getGoalContent()}
			</section>
		</article>
	);
});
