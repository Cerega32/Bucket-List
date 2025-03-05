import Cookies from 'js-cookie';
import {observer} from 'mobx-react-lite';
import {FC} from 'react';

import {CatalogItems} from '@/components/CatalogItems/CatalogItems';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import './user-self-goals.scss';

interface UserSelfGoalsProps {
	subPage: string;
	completed: boolean;
}

export const UserSelfGoals: FC<UserSelfGoalsProps> = observer((props) => {
	const {subPage, completed} = props;

	const [block, element] = useBem('user-self-goals');

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
			/>
		</section>
	);
});
