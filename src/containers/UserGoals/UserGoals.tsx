import {observer} from 'mobx-react';
import {FC} from 'react';

import './user-goals.scss';
import {CatalogItems} from '@/components/CatalogItems/CatalogItems';

import {useBem} from '@/hooks/useBem';

interface UserGoalsProps {
	id: string;
	subPage: string;
	completed: boolean;
}

export const UserGoals: FC<UserGoalsProps> = observer((props) => {
	const {id, subPage, completed = false} = props;

	const [block] = useBem('user-goals');

	return (
		<section className={block()}>
			<CatalogItems
				userId={id}
				beginUrl={`/user/${id}/${completed ? 'done' : 'active'}-goals`}
				completed={completed}
				subPage={subPage}
			/>
		</section>
	);
});
