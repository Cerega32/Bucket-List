import {FC, useEffect, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Loader} from '@/components/Loader/Loader';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {IComplexity, IGoal} from '@/typings/goal';
import {GET} from '@/utils/fetch/requests';
import {selectComplexity} from '@/utils/values/complexity';

import Select from '../Select/Select';

import './external-goal-search.scss';

interface ExternalGoalResult {
	externalId: string | number;
	title: string;
	description?: string;
	imageUrl?: string;
	type: 'movie' | 'book' | 'travel';
	releaseDate?: string;
	authors?: string[];
	address?: string;
	popularity?: number;
}

interface ExternalGoalSearchProps {
	onGoalSelected: (goalData: Partial<IGoal> & {imageUrl?: string; external_id?: string | number; externalType?: string}) => void;
	className?: string;
}

export const ExternalGoalSearch: FC<ExternalGoalSearchProps> = ({onGoalSelected, className}) => {
	const [block, element] = useBem('external-goal-search', className);
	const [query, setQuery] = useState('');
	const [category, setCategory] = useState<'movies' | 'books'>('books'); // По умолчанию фильмы
	const [results, setResults] = useState<ExternalGoalResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [activeComplexity, setActiveComplexity] = useState<number>(1); // По умолчанию средняя сложность (индекс 1)
	const [searchWasPerformed, setSearchWasPerformed] = useState(false);
	const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

	// Проверка доступности кнопки поиска
	const isSearchButtonDisabled = loading || query.length < 2;

	// Очистка состояния загрузки изображений при изменении результатов
	useEffect(() => {
		setImageLoading({});
	}, [results]);

	// Функция для поиска внешних целей
	const searchExternalGoals = async () => {
		if (query.length < 2) {
			setResults([]);
			setSearchWasPerformed(false);
			return;
		}

		setLoading(true);
		setSearchWasPerformed(true);
		try {
			const response = await GET('goals/search-external', {
				get: {category, query},
			});

			if (response.success && response.data.results) {
				// Полностью заменяем результаты вместо добавления
				setResults(response.data.results);
			} else {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: 'Не удалось найти подходящие цели',
				});
				setResults([]);
			}
		} catch (error) {
			console.error('Ошибка при поиске:', error);
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Произошла ошибка при поиске',
			});
			setResults([]);
		} finally {
			setLoading(false);
		}
	};

	// Обработчик изменения запроса
	const handleQueryChange = (value: string) => {
		setQuery(value);
		if (value.length === 0) {
			setResults([]);
			setSearchWasPerformed(false);
		}
	};

	// Обработчик загрузки изображения
	const handleImageLoad = (id: string) => {
		setImageLoading((prev) => ({...prev, [id]: false}));
	};

	// Обработчик ошибки загрузки изображения
	const handleImageError = (id: string) => {
		setImageLoading((prev) => ({...prev, [id]: false}));
	};

	// Обработчик выбора цели - теперь просто передает данные родительскому компоненту
	const handleSelectGoal = async (goalData: ExternalGoalResult) => {
		// Преобразуем данные в формат, подходящий для IGoal
		const goalInfo: Partial<IGoal> & {imageUrl?: string; external_id?: string | number; externalType?: string} = {
			title: goalData.title,
			description: goalData.description || `Цель: ${goalData.title}`,
			external_id: goalData.externalId, // Сохраняем ID внешнего источника
			externalType: goalData.type, // Тип внешнего источника
			complexity: selectComplexity[activeComplexity].value as IComplexity,
		};
		// Если есть URL изображения, проверяем его доступность
		if (goalData.imageUrl) {
			setImageLoading((prev) => ({...prev, [String(goalData.externalId)]: true}));

			goalInfo.imageUrl = goalData.imageUrl;
			setImageLoading((prev) => ({...prev, [String(goalData.externalId)]: false}));
		} else {
			NotificationStore.addNotification({
				type: 'warning',
				title: 'Внимание',
				message: 'Не удалось загрузить изображение. Вам нужно будет выбрать его вручную.',
			});
		}

		// Вызываем обработчик выбора цели с данными созданной цели
		onGoalSelected(goalInfo);

		// Очищаем результаты поиска и поисковый запрос
		setResults([]);
		setQuery('');
		setSearchWasPerformed(false);

		NotificationStore.addNotification({
			type: 'success',
			title: 'Готово',
			message: 'Данные цели загружены! Проверьте и дополните при необходимости.',
		});
	};

	// Опции для категорий
	const categoryOptions = [
		{name: 'Книги', value: 'books'},
		// {name: 'Фильмы', value: 'movies'},
		// {name: 'Путешествия', value: 'travel'},
	];

	return (
		<div className={block()}>
			<h3 className={element('title')}>Найти готовую цель</h3>
			<div className={element('search-panel')}>
				<div className={element('selectors')}>
					<Select
						className={element('category-select')}
						placeholder="Выберите тип"
						options={categoryOptions}
						activeOption={categoryOptions.findIndex((opt) => opt.value === category)}
						onSelect={(index) => {
							setCategory(categoryOptions[index].value as 'movies' | 'books');
							// Очищаем результаты при смене категории
							setResults([]);
							setSearchWasPerformed(false);
						}}
						text="Тип контента"
					/>

					<Select
						className={element('complexity-select')}
						placeholder="Выберите сложность"
						options={selectComplexity}
						activeOption={activeComplexity}
						onSelect={setActiveComplexity}
						text="Сложность"
					/>
				</div>

				<div className={element('search-field')}>
					<FieldInput
						id="external-search"
						text="Поиск"
						value={query}
						setValue={handleQueryChange}
						placeholder="Введите название для поиска..."
						iconBegin="search"
						className={element('search-input')}
						onKeyDown={(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
							if (e.key === 'Enter' && !isSearchButtonDisabled) {
								e.preventDefault();
								searchExternalGoals();
							}
						}}
					/>

					<Button
						theme="blue"
						icon="search"
						onClick={searchExternalGoals}
						size="medium"
						className={`${element('search-button')} ${isSearchButtonDisabled ? 'disabled' : ''}`}
					>
						{loading ? 'Поиск...' : 'Найти'}
					</Button>
				</div>
			</div>

			<div className={element('results-container', {'is-empty': results.length === 0 && !loading})}>
				<Loader isLoading={loading}>
					{results.length > 0 && (
						<div className={element('results')}>
							{results.map((item) => (
								<div className={element('result-item')} key={`${item.type}-${item.externalId}`}>
									<div className={element('result-image')}>
										{item.imageUrl ? (
											<>
												{/* {imageLoading[String(item.externalId)] && (
													<div className={element('image-loading')}>
														<Svg icon="loading" className={element('loading-icon')} />
													</div>
												)} */}
												<img
													src={item.imageUrl}
													alt={item.title}
													onLoad={() => handleImageLoad(String(item.externalId))}
													onError={() => handleImageError(String(item.externalId))}
												/>
											</>
										) : (
											<div className={element('no-image')}>
												<Svg icon="mount" />
											</div>
										)}
									</div>
									<div className={element('result-details')}>
										<h4 className={element('result-title')}>{item.title}</h4>
										{item.description && (
											<p className={element('result-description')}>{item.description.substring(0, 150)}...</p>
										)}
										<div className={element('result-meta')}>
											{item.type === 'movie' && item.releaseDate && (
												<span>Год: {item.releaseDate.substring(0, 4)}</span>
											)}
											{item.type === 'book' && item.authors && <span>Авторы: {item.authors.join(', ')}</span>}
											{item.type === 'travel' && item.address && <span>Адрес: {item.address}</span>}
										</div>
										<Button
											theme="green"
											onClick={() => handleSelectGoal(item)}
											className={`${element('add-button')} ${
												imageLoading[String(item.externalId)] ? 'disabled' : ''
											}`}
											icon="plus"
										>
											{imageLoading[String(item.externalId)] ? 'Проверка...' : 'Добавить как цель'}
										</Button>
									</div>
								</div>
							))}
						</div>
					)}

					{results.length === 0 && searchWasPerformed && !loading && (
						<div className={element('no-results')}>
							<Svg icon="info" className={element('info-icon')} />
							<p>Ничего не найдено. Попробуйте другой запрос.</p>
						</div>
					)}
				</Loader>
			</div>
		</div>
	);
};
