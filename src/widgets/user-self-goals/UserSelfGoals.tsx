import Cookies from 'js-cookie';
import {observer} from 'mobx-react-lite';
import {FC, useEffect, useMemo, useState} from 'react';

import {getCategories} from '@/entities/category/api/getCategories';
import {sortMainCategories} from '@/entities/category/lib/categoriesOrder';
import {getMergeRequests, IGoalMergeRequest} from '@/entities/goal/api/goals';
import {ICategoryDetailed} from '@/entities/goal/model/types';
import {CatalogItems} from '@/features/catalog-items/CatalogItems';
import {MergeRequestsList} from '@/features/merge-requests-list/MergeRequestsList';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Banner} from '@/shared/ui/Banner/Banner';
import {ISwitch} from '@/shared/ui/Switch/Switch';
import {Title} from '@/shared/ui/Title/Title';
import '@/widgets/user-self-goals/user-self-goals.scss';

interface UserSelfGoalsProps {
	subPage: string;
	completed: boolean;
	pendingCatalogReview?: boolean;
}

export const UserSelfGoals: FC<UserSelfGoalsProps> = observer((props) => {
	const {subPage, completed, pendingCatalogReview = false} = props;

	const [block, element] = useBem('user-self-goals');
	const [categories, setCategories] = useState<Array<ICategoryDetailed>>([]);
	const [mergeRequests, setMergeRequests] = useState<Array<IGoalMergeRequest>>([]);

	useEffect(() => {
		(async () => {
			const res = await getCategories();
			if (res.success) {
				setCategories(sortMainCategories(res.data));
			}
		})();
	}, []);

	useEffect(() => {
		if (!pendingCatalogReview) return;
		(async () => {
			const res = await getMergeRequests();
			if (res.success && res.data) {
				setMergeRequests(Array.isArray(res.data) ? res.data : res.data.results ?? []);
			}
		})();
	}, [pendingCatalogReview]);

	// Вкладка «Объединения» показывается только если есть запросы (обработанные хранятся 30 дней)
	const mergeSwitchButtons = useMemo((): Array<ISwitch> => {
		if (!pendingCatalogReview || mergeRequests.length === 0) return [];
		return [
			{
				url: '/user/self/pending-review/merges',
				name: 'Объединения',
				page: 'merges',
				count: mergeRequests.length,
			},
		];
	}, [pendingCatalogReview, mergeRequests.length]);

	const isMergesPage = pendingCatalogReview && subPage === 'merges';

	return (
		<div className={block()}>
			<Title tag="h2" className={element('title')}>
				{pendingCatalogReview ? 'Модерация' : completed ? 'Выполненные цели и списки' : 'Все активные цели и списки'}
			</Title>
			{pendingCatalogReview && !isMergesPage && (
				<Banner
					type="info"
					className={element('moderation-info')}
					title="Что означают статусы"
					message={
						<ul>
							<li>
								<strong>На проверке</strong> — цель или список на модерации, в общем каталоге пока не отображается.
							</li>
							<li>
								<strong>В каталоге</strong> — одобрено модератором, доступно всем пользователям в каталоге.
							</li>
							<li>
								<strong>Требует правки</strong> — модератор указал причину отказа. Отредактируйте цель или список и
								отправьте на повторную проверку — доступно до 3 попыток.
							</li>
							<li>
								<strong>Отклонено</strong> — все 3 попытки использованы; запись будет удалена автоматически. Создайте новую
								версию с другой формулировкой.
							</li>
						</ul>
					}
				/>
			)}
			{isMergesPage && (
				<Banner
					type="info"
					className={element('moderation-info')}
					title="Запросы на объединение дублей"
					message={
						<ul>
							<li>
								<strong>На рассмотрении</strong> — модераторы ещё не обработали запрос.
							</li>
							<li>
								<strong>Одобрено</strong> — цели объединены, прогресс всех участников сохранён, вам начислен опыт.
							</li>
							<li>
								<strong>Отклонено</strong> — модератор посчитал цели разными, см. комментарий.
							</li>
							<li>Обработанные запросы автоматически удаляются из списка через 30 дней.</li>
						</ul>
					}
				/>
			)}
			{isMergesPage ? (
				<MergeRequestsList
					requests={mergeRequests}
					switchButtons={[
						{url: '/user/self/pending-review', name: 'Цели', page: 'goals'},
						{url: '/user/self/pending-review/lists', name: 'Списки', page: 'lists'},
						...mergeSwitchButtons,
					]}
				/>
			) : (
				<CatalogItems
					userId={Cookies.get('user-id') as string}
					beginUrl={pendingCatalogReview ? '/user/self/pending-review' : `/user/self/${completed ? 'done' : 'active'}-goals`}
					completed={completed}
					subPage={subPage}
					columns="3"
					categories={categories}
					searchWrapperWrap
					pendingCatalogReview={pendingCatalogReview}
					extraSwitchButtons={mergeSwitchButtons}
				/>
			)}
		</div>
	);
});
