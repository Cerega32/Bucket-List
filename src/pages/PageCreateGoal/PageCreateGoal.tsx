import {observer} from 'mobx-react-lite';
import {FC, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

import {notifyEmailConfirmationRequired} from '@/entities/user/lib/requireEmailConfirmed';
import {UserStore} from '@/entities/user/model/UserStore';
import {AddGoal} from '@/features/add-goal/AddGoal';
import {ThemeStore} from '@/shared/model/ThemeStore';
import {IPage} from '@/shared/types/page';

export const PageCreateGoal: FC<IPage> = observer(({page}) => {
	const navigate = useNavigate();
	const {setPage, setHeader, setFull} = ThemeStore;
	const {emailConfirmed} = UserStore;

	useEffect(() => {
		setPage(page);
		setHeader('white');
		setFull(false);
	}, [page, setPage, setHeader, setFull]);

	useEffect(() => {
		if (emailConfirmed) {
			return;
		}

		notifyEmailConfirmationRequired();
		navigate('/user/self/settings', {replace: true});
	}, [emailConfirmed, navigate]);

	if (!emailConfirmed) {
		return null;
	}

	return <AddGoal />;
});
