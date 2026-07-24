import {observer} from 'mobx-react-lite';
import {FC, useEffect} from 'react';
import {Navigate, useSearchParams} from 'react-router-dom';

import {getUser} from '@/entities/user/api/getUser';
import {UserStore} from '@/entities/user/model/UserStore';
import {useBem} from '@/shared/lib/hooks/useBem';
import {NotificationStore} from '@/shared/model/NotificationStore';
import {ThemeStore} from '@/shared/model/ThemeStore';
import {IPage} from '@/shared/types/page';
import {Button} from '@/shared/ui/Button/Button';
import {Svg} from '@/shared/ui/Svg/Svg';
import {Title} from '@/shared/ui/Title/Title';

import './PageEmailConfirmed.scss';

export const PageEmailConfirmed: FC<IPage> = observer(({page}) => {
	const {setHeader, setPage, setFull} = ThemeStore;
	const [searchParams] = useSearchParams();
	const ok = searchParams.get('ok') === '1';
	const premiumGranted = searchParams.get('premium') === '1';
	const error = searchParams.get('error') || '';

	const [block, element] = useBem('page-email-confirmed');

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(true);

		if (ok && UserStore.isAuth) {
			UserStore.setEmailConfirmed(true);
			if (premiumGranted) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Premium на 60 дней — ваш!',
					message: 'Мы дали вам премиум бесплатно. Пожалуйста, напишите, если что-то сломается или если у вас есть идеи.',
				});
				getUser();
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ok, premiumGranted]);

	if (ok) {
		if (UserStore.isAuth) {
			return <Navigate to="/user/self/settings" replace />;
		}
		return <Navigate to="/sign-in" replace />;
	}

	const isMissing = error === 'missing';
	const title = isMissing ? 'Нет ссылки' : 'Ссылка недействительна';
	const text = isMissing
		? 'В ссылке отсутствует код подтверждения. Запросите новое письмо в настройках или на странице входа.'
		: 'Ссылка недействительна, устарела или уже использована. Запросите новое письмо в настройках.';

	return (
		<div className={block()}>
			<Svg icon="icon-logo" className={element('logo')} />
			<Title tag="h3" className={element('title')}>
				{title}
			</Title>
			<p className={element('message')}>{text}</p>
			<div className={element('actions')}>
				<Button theme="blue" className={element('btn')} type="Link" href="/sign-in">
					Перейти к входу
				</Button>
			</div>
		</div>
	);
});
