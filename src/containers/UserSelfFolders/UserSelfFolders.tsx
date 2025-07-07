import {observer} from 'mobx-react-lite';
import {FC} from 'react';

import {GoalFolderManager} from '@/components/GoalFolderManager/GoalFolderManager';
import {useBem} from '@/hooks/useBem';

import './user-self-folders.scss';

export const UserSelfFolders: FC = observer(() => {
	const [block, element] = useBem('user-self-folders');

	return (
		<section className={block()}>
			<div className={element('content')}>
				<GoalFolderManager />
			</div>
		</section>
	);
});
