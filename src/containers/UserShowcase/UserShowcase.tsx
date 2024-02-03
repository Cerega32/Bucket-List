import {observer} from 'mobx-react';
import {FC, useEffect, useState} from 'react';

import {CommentsGoal} from '@/components/CommentsGoal/CommentsGoal';
import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';
import {IComment} from '@/typings/comments';
import {IPage} from '@/typings/page';
import {getAddedGoals} from '@/utils/api/get/getAddedGoals';
import './user-showcase.scss';
import {ListGoals} from '@/components/ListGoals/ListGoals';
import {getAddedLists} from '@/utils/api/get/getAddedLists';
import {GET} from '@/utils/fetch/requests';

interface UserShowcaseProps {
	id: string;
}

export const UserShowcase: FC<UserShowcaseProps> = observer((props) => {
	const {id} = props;
	const [block, element] = useBem('user-showcase');

	// const {addedGoals, addedLists} = UserStore;
	const [comments, setComments] = useState<Array<IComment>>([]);

	useEffect(() => {
		(async () => {
			const res = await GET(`comments/${id}`, {auth: true});
			if (res.success) {
				setComments(res.data.data);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<section className={block()}>
			<CommentsGoal comments={comments} setComments={setComments} isUser />
		</section>
	);
});
