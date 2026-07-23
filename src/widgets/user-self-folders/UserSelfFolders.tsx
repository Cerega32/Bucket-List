import {observer} from 'mobx-react-lite';
import {FC} from 'react';

import {GoalFolderManager} from '@/features/goal-folder-manager/GoalFolderManager';
import {useBem} from '@/shared/lib/hooks/useBem';

import '@/widgets/user-self-folders/user-self-folders.scss';

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
