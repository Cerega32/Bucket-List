import {observer} from 'mobx-react-lite';
import {FC} from 'react';

import {Button} from '@/components/Button/Button';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import './not-found.scss';

export const NotFound: FC = observer(() => {
	const [block, element] = useBem('not-found');

	return (
		<main className={block()}>
			<Title tag="h1">404</Title>
			<Title tag="h2">Такой страницы не существует</Title>
			<p>Возможно страница была удалена или перемещена. Попробуйте обновить запрос</p>
			<Button className={element('link')} href="/" type="Link" theme="blue" size="medium">
				Вернуться на главную
			</Button>
		</main>
	);
});
