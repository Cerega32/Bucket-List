import {observer} from 'mobx-react-lite';
import {FC} from 'react';

import {Title} from '@/components/Title/Title';
import {UserSearch} from '@/components/UserSearch/UserSearch';
import {useBem} from '@/hooks/useBem';
import {FriendsStore} from '@/store/FriendsStore';

import './friends-search.scss';

export const FriendsSearch: FC = observer(() => {
	const [block, element] = useBem('friends-search');

	return (
		<section className={block()}>
			<div className={element('header')}>
				<Title tag="h1" className={element('title')}>
					Поиск пользователей
				</Title>
				<p className={element('subtitle')}>Найдите единомышленников и отправьте им заявки в друзья</p>
			</div>

			<div className={element('search-container')}>
				<UserSearch />
			</div>

			{FriendsStore.searchResults.length > 0 && (
				<div className={element('tips')}>
					<h3 className={element('tips-title')}>Полезные советы:</h3>
					<ul className={element('tips-list')}>
						<li>Просмотрите профиль пользователя перед отправкой заявки</li>
						<li>Добавляйте пользователей с похожими целями и интересами</li>
						<li>Сравнивайте свои достижения с друзьями для мотивации</li>
					</ul>
				</div>
			)}
		</section>
	);
});
