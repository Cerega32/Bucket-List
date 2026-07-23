import {FC, useCallback} from 'react';
import {useSearchParams} from 'react-router-dom';

import {IShortGoal} from '@/entities/goal/model/types';
import {Card} from '@/entities/goal/ui/Card/Card';
import {UserStore} from '@/entities/user/model/UserStore';
import {useBem} from '@/shared/lib/hooks/useBem';
import {EmptyState} from '@/shared/ui/EmptyState/EmptyState';
import {parseListGoalsFilterValues} from '@/widgets/list-goals-filters/listGoalsFiltersUtils';
import '@/widgets/list-goals/list-goals.scss';

interface ListGoalsProps {
	className?: string;
	horizontal?: boolean;
	list: Array<IShortGoal>;
	columns?: 'two' | 'three' | 'four';
	searchQuery?: string;
	updateGoal: (code: string, i: number, operation: 'add' | 'delete' | 'mark', done?: boolean) => Promise<void | boolean>;
}

export const ListGoals: FC<ListGoalsProps> = (props) => {
	const {className, list, horizontal, columns = 'three', searchQuery = '', updateGoal} = props;
	const [searchParams] = useSearchParams();
	const {isAuth} = UserStore;

	const [block, element] = useBem('list', className);

	const hasActiveFilters = useCallback(() => {
		const filters = parseListGoalsFilterValues(searchParams);
		const hasFilterValues = Object.values(filters).some((values) => values.length > 0);
		const hasSearch = searchQuery.trim().length >= 3;
		const hasSort = !!searchParams.get('sort');
		return hasFilterValues || hasSearch || hasSort;
	}, [searchParams, searchQuery]);

	const handleGoalUpdate = async (code: string, _: number, operation: 'add' | 'delete' | 'mark', done?: boolean) => {
		const originalIndex = list.findIndex((goal) => goal.code === code);
		if (originalIndex !== -1) {
			await updateGoal(code, originalIndex, operation, done);
		}
	};

	if (list.length === 0) {
		const isFiltered = hasActiveFilters();
		return (
			<EmptyState
				title={isFiltered ? 'По запросу ничего не найдено' : 'В этом списке пока нет целей'}
				description={
					isFiltered
						? 'Попробуйте изменить параметры поиска или фильтры'
						: isAuth
						? 'Цели появятся здесь после добавления в список'
						: undefined
				}
				size="small"
			/>
		);
	}

	return (
		<section className={block()}>
			<div className={element('grid', {columns})}>
				{list.map((goal, i) => (
					<Card
						key={goal.code}
						goal={goal}
						className={element('goal')}
						horizontal={horizontal}
						onClickAdd={() => handleGoalUpdate(goal.code, i, 'add')}
						onClickDelete={() => handleGoalUpdate(goal.code, i, 'delete')}
						onClickMark={() => {
							return handleGoalUpdate(goal.code, i, 'mark', goal.completedByUser);
						}}
					/>
				))}
			</div>
		</section>
	);
};
