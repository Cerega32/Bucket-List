import Cookies from 'js-cookie';
import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {Banner} from '@/components/Banner/Banner';
import {CatalogItems} from '@/components/CatalogItems/CatalogItems';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ICategoryDetailed} from '@/typings/goal';
import {getCategories} from '@/utils/api/get/getCategories';
import {sortMainCategories} from '@/utils/values/categoriesOrder';
import './user-self-goals.scss';

interface UserSelfGoalsProps {
	subPage: string;
	completed: boolean;
	/** Раздел «Публикации в каталог» (модерация и история) */
	pendingCatalogReview?: boolean;
}

export const UserSelfGoals: FC<UserSelfGoalsProps> = observer((props) => {
	const {subPage, completed, pendingCatalogReview = false} = props;

	const [block, element] = useBem('user-self-goals');
	const [categories, setCategories] = useState<Array<ICategoryDetailed>>([]);

	useEffect(() => {
		(async () => {
			const res = await getCategories();
			if (res.success) {
				setCategories(sortMainCategories(res.data));
			}
		})();
	}, []);

	return (
		<div className={block()}>
			<Title tag="h2" className={element('title')}>
				{pendingCatalogReview ? 'Публикации в каталог' : completed ? 'Выполненные цели и списки' : 'Все активные цели и списки'}
			</Title>
			{pendingCatalogReview && (
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
			<CatalogItems
				userId={Cookies.get('user-id') as string}
				beginUrl={pendingCatalogReview ? '/user/self/pending-review' : `/user/self/${completed ? 'done' : 'active'}-goals`}
				completed={completed}
				subPage={subPage}
				columns="3"
				categories={categories}
				searchWrapperWrap
				pendingCatalogReview={pendingCatalogReview}
			/>
		</div>
	);
});
