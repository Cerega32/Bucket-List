import {observer} from 'mobx-react';
import {FC, useEffect, useState} from 'react';

import {CommentsGoal} from '@/components/CommentsGoal/CommentsGoal';
import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';
import {IComment} from '@/typings/comments';
import {IPage} from '@/typings/page';
import {getAddedGoals} from '@/utils/api/get/getAddedGoals';
import './user-achievements.scss';
import {ListGoals} from '@/components/ListGoals/ListGoals';
import {getAddedLists} from '@/utils/api/get/getAddedLists';
import {GET} from '@/utils/fetch/requests';

interface UserAchievementsProps {
	id: string;
}

export const UserAchievements: FC<UserAchievementsProps> = observer((props) => {
	const {id} = props;
	const [block, element] = useBem('user-achievements');

	// const [comments, setComments] = useState<Array<IComment>>([]);

	useEffect(() => {
		(async () => {
			const res = await GET('achievements', {auth: true});
			if (res.success) {
				// setComments(res.data.data);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <section className={block()}>{/* <CommentsGoal comments={comments} setComments={setComments} isUser /> */}</section>;
});
