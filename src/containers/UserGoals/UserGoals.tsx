import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {CatalogItems} from '@/components/CatalogItems/CatalogItems';
import {useBem} from '@/hooks/useBem';
import {ICategoryDetailed} from '@/typings/goal';
import {getCategories} from '@/utils/api/get/getCategories';
import './user-goals.scss';

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
				setCategories(res.data);
			}
		})();
	}, []);

	return (
		<section className={block()}>
			<CatalogItems
				userId={id}
				beginUrl={`/user/${id}/${completed ? 'done' : 'active'}-goals`}
				completed={completed}
				subPage={subPage}
				categories={categories}
			/>
		</section>
	);
});
