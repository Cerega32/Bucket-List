import {observer} from 'mobx-react';
import {FC, useEffect} from 'react';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '@/store/ThemeStore';
import {IPage} from '@/typings/page';
import {Title} from '@/components/Title/Title';
import {Button} from '@/components/Button/Button';
import './not-found.scss';

export const NotFound: FC = observer(() => {
	const [block, element] = useBem('user');

	const {setHeader} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<main className={block()}>
			<Title tag="h1">404</Title>
			<Title tag="h2">Такой страницы не существует</Title>
			<p>
				Возможно страница была удалена или перемещена. Попробуйте
				обновить запрос
			</p>
			<Button href="/" type="Link">
				Вернуться на главную
			</Button>
		</main>
	);
});
