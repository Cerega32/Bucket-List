import {FC} from 'react';

import {IGoalFolder} from '@/entities/goal/model/types';
import {useBem} from '@/shared/lib/hooks/useBem';

import '@/features/goal-folder-manager/goal-folder-manager.scss';

interface GoalFoldersShowcaseProps {
	className?: string;
	folders: IGoalFolder[];
	activeFolderId?: number;
}

export const GoalFoldersShowcase: FC<GoalFoldersShowcaseProps> = (props) => {
	const {className, folders, activeFolderId} = props;
	const [block, element] = useBem('goal-folder-manager', className);

	return (
		<div className={block()}>
			<div className={element('folders-list')}>
				<div className={element('folders')}>
					{folders.map((folder) => (
						<div key={folder.id} className={element('folder', {active: activeFolderId === folder.id})} role="presentation">
							<div className={element('folder-badge')} style={{backgroundColor: folder.color || '#3A89D8'}} />
							<div className={element('folder-info')}>
								<h4 className={element('folder-name')}>{folder.name}</h4>
								{folder.description && <p className={element('folder-description')}>{folder.description}</p>}
								<p className={element('folder-meta')}>Целей: {folder.goalsCount}</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
