import {observer} from 'mobx-react-lite';
import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {FriendCompareView} from '@/components/FriendCompareView/FriendCompareView';
import {Loader} from '@/components/Loader/Loader';
import {useBem} from '@/hooks/useBem';
import {ComparisonData, compareWithFriend} from '@/utils/api/friends/friendsApi';

import './page-friend-compare.scss';

interface PageFriendCompareProps {
	page: string;
}

export const PageFriendCompare: React.FC<PageFriendCompareProps> = observer(() => {
	const [block, element] = useBem('page-friend-compare');
	const {friendId} = useParams<{friendId: string}>();
	const navigate = useNavigate();
	const [comparison, setComparison] = useState<ComparisonData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Загрузка данных для сравнения
	useEffect(() => {
		const loadComparisonData = async () => {
			setIsLoading(true);
			setError(null);

			if (!friendId) {
				setError('Не указан ID друга для сравнения');
				setIsLoading(false);
				return;
			}

			try {
				const response = await compareWithFriend(parseInt(friendId, 10));
				if (response.success && response.data) {
					setComparison(response.data);
				} else {
					setError(response.error || 'Не удалось загрузить данные для сравнения');
				}
			} catch (err) {
				console.error('Ошибка при загрузке данных для сравнения:', err);
				setError('Произошла ошибка при загрузке данных для сравнения');
			} finally {
				setIsLoading(false);
			}
		};

		loadComparisonData();
	}, [friendId]);

	// Возврат к списку друзей
	const handleBackToFriends = () => {
		navigate('/user/self/friends');
	};

	return (
		<main className={block()}>
			<div className={element('header')}>
				<Button theme="blue-light" className={element('back-button')} onClick={handleBackToFriends} icon="arrow-left">
					К списку друзей
				</Button>
				<h1 className={element('title')}>Сравнение активности</h1>
			</div>

			<Loader isLoading={isLoading}>
				{error ? (
					<div className={element('error')}>{error}</div>
				) : comparison ? (
					<div className={element('comparison-container')}>
						<FriendCompareView comparison={comparison} />
					</div>
				) : null}
			</Loader>
		</main>
	);
});
