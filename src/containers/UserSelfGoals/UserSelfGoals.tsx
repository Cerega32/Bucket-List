import Cookies from 'js-cookie';
import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {CatalogItems} from '@/components/CatalogItems/CatalogItems';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ICategoryDetailed} from '@/typings/goal';
import {getCategories} from '@/utils/api/get/getCategories';
import './user-self-goals.scss';

interface UserSelfGoalsProps {
	subPage: string;
	completed: boolean;
}

export const UserSelfGoals: FC<UserSelfGoalsProps> = observer((props) => {
	const {subPage, completed} = props;

	const [block, element] = useBem('user-self-goals');

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
			<Title tag="h2" className={element('title')}>
				{completed ? 'Выполненные цели и списки' : 'Все активные цели и списки'}
			</Title>
			<CatalogItems
				userId={Cookies.get('user-id') as string}
				beginUrl={`/user/self/${completed ? 'done' : 'active'}-goals`}
				completed={completed}
				subPage={subPage}
				columns="3"
				categories={categories}
			/>
		</section>
	);
});
