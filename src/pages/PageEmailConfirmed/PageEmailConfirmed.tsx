import {observer} from 'mobx-react-lite';
import {FC, useEffect} from 'react';
import {Navigate, useSearchParams} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '@/store/ThemeStore';
import {UserStore} from '@/store/UserStore';
import {IPage} from '@/typings/page';

import './PageEmailConfirmed.scss';

export const PageEmailConfirmed: FC<IPage> = observer(({page}) => {
	const {setHeader, setPage, setFull} = ThemeStore;
	const [searchParams] = useSearchParams();
	const ok = searchParams.get('ok') === '1';
	const error = searchParams.get('error') || '';

	const [block, element] = useBem('page-email-confirmed');

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(true);

		// Если email успешно подтвержден, обновляем статус в UserStore
		if (ok && UserStore.isAuth) {
			UserStore.setEmailConfirmed(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ok]);

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
