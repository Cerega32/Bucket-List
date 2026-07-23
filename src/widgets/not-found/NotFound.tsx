import {observer} from 'mobx-react-lite';
import {FC} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import {Button} from '@/shared/ui/Button/Button';
import {Title} from '@/shared/ui/Title/Title';
import '@/widgets/not-found/not-found.scss';

export const NotFound: FC = observer(() => {
	const [block, element] = useBem('not-found');

	return (
		<main className={block()}>
			<Title tag="h1">404</Title>
			<Title tag="h2">Такой страницы не существует</Title>
			<p>Возможно страница была удалена или перемещена. Попробуйте обновить запрос</p>
			<Button className={element('link')} href="/" type="Link" theme="blue" size="medium" width="auto">
				Вернуться на главную
			</Button>
		</main>
	);
});
