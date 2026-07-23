import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {getCategories} from '@/entities/category/api/getCategories';
import {sortMainCategories} from '@/entities/category/lib/categoriesOrder';
import {ICategoryDetailed} from '@/entities/goal/model/types';
import {CatalogItems} from '@/features/catalog-items/CatalogItems';
import {useBem} from '@/shared/lib/hooks/useBem';
import '@/widgets/user-goals/user-goals.scss';

interface UserGoalsProps {
	id: string;
	subPage: string;
	completed?: boolean;
}

export const UserGoals: FC<UserGoalsProps> = observer((props) => {
	const {id, subPage, completed = false} = props;

	const [block] = useBem('user-goals');

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
			<CatalogItems
				userId={id}
				beginUrl={`/user/${id}/${completed ? 'done' : 'active'}-goals`}
				completed={completed}
				subPage={subPage}
				categories={categories}
			/>
		</div>
	);
});
