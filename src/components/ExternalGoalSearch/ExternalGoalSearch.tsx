import {FC, useEffect, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Loader} from '@/components/Loader/Loader';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {IComplexity, IGoal} from '@/typings/goal';
import {GET, getFantLabWorkDetails} from '@/utils/fetch/requests';
import {selectComplexity} from '@/utils/values/complexity';

import Select from '../Select/Select';

import './external-goal-search.scss';

// Список поддерживаемых категорий
const SupportedCategories = ['books', 'cinema-art', 'gaming'];

interface ExternalGoalResult {
	apiSource: string;
	externalId: string | number;
	title: string;
	description?: string;
	imageUrl?: string;
	type: 'cinema-art' | 'book' | 'travel' | 'gaming' | 'existing_goal';
	releaseDate?: string;
	authors?: string[];
	address?: string;
	popularity?: number;
	isOwnDatabase?: boolean; // Является ли результат из собственной БД
	matchPercentage?: number; // Процент совпадения для собственных результатов
	match_percentage?: number; // Альтернативное название поля
	goalCode?: string; // Код цели для существующих целей
	source?: string;
	// Дополнительные поля из API
	additionalFields?: {
		// Поля для игр
		platforms?: string[];
		rating?: number;
		metacritic?: number;
		released?: string;
		genres?: string[];
		developers?: string[];

		// Поля для книг
		authors?: string[];
		publishedDate?: string;

		// Поля для фильмов
		contentType?: string;
		ratingKp?: number;
		ratingImdb?: number;
		year?: number;
		countries?: string[];
	};
}

interface ExternalGoalSearchProps {
	onGoalSelected: (goalData: Partial<IGoal> & {imageUrl?: string; external_id?: string | number; externalType?: string}) => void;
	className?: string;
	category?: string | undefined;
	initialQuery?: string; // Начальный поисковый запрос
}

export const ExternalGoalSearch: FC<ExternalGoalSearchProps> = ({onGoalSelected, className, category, initialQuery}) => {
	const [block, element] = useBem('external-goal-search', className);
	const [query, setQuery] = useState(initialQuery || '');
	const [results, setResults] = useState<ExternalGoalResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [activeComplexity, setActiveComplexity] = useState<number>(1); // По умолчанию средняя сложность (индекс 1)
	const [searchWasPerformed, setSearchWasPerformed] = useState(false);
	const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

	// Проверка доступности кнопки поиска
	const isSearchButtonDisabled = loading || query.length < 2;

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
				// Обрабатываем новую структуру ответа
				const {ownResults = [], externalResults = []} = response.data.results;

				// Объединяем результаты: сначала свои, потом внешние
				const combinedResults = [
					...ownResults.map((result: any) => ({...result, isOwnDatabase: true})),
					...externalResults.map((result: any) => ({...result, isOwnDatabase: false})),
				];

				setResults(combinedResults);
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

	// Очистка состояния загрузки изображений при изменении результатов
	useEffect(() => {
		setImageLoading({});
	}, [results]);

	// Автоматический поиск при передаче initialQuery
	useEffect(() => {
		if (initialQuery && initialQuery.length >= 2) {
			searchExternalGoals();
		}
	}, [initialQuery]);

	// Если категория не поддерживается или не передана, не показываем компонент
	if (!category || !SupportedCategories.includes(category)) {
		return null;
	}

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

	// Обработчик выбора цели - теперь загружает детальную информацию для книг
	const handleSelectGoal = async (goalData: ExternalGoalResult) => {
		// Показываем индикатор загрузки для данного элемента
		setImageLoading((prev) => ({...prev, [String(goalData.externalId)]: true}));

		try {
			let enhancedGoalData = goalData;
			console.log('🔍 Initial goalData:', goalData);

			// Если это книга из FantLab, загружаем детальную информацию
			if (goalData.type === 'book' && goalData.apiSource === 'fantlab' && !goalData.isOwnDatabase) {
				console.log('📚 Loading FantLab details for book ID:', goalData.externalId);

				try {
					const detailsResponse = await getFantLabWorkDetails(String(goalData.externalId));
					console.log('📖 FantLab details response:', detailsResponse);

					if (detailsResponse.success) {
						// Исправляем двойную вложенность ответа
						const details = detailsResponse.data?.data || detailsResponse.data;
						console.log('✅ FantLab details data (corrected):', details);
						console.log('📝 Details description:', details.description);
						console.log('🖼️ Details imageUrl:', details.imageUrl);

						// Обогащаем данные детальной информацией
						enhancedGoalData = {
							...goalData,
							title: details.title || goalData.title,
							description: details.description || goalData.description,
							imageUrl: details.imageUrl || goalData.imageUrl,
							authors: details.authors || goalData.authors,
							additionalFields: {
								...goalData.additionalFields,
								...details.additionalFields,
							},
						};

						console.log('🔧 Enhanced goal data:', enhancedGoalData);

						NotificationStore.addNotification({
							type: 'success',
							title: 'Информация загружена',
							message: 'Получена детальная информация о произведении',
						});
					} else {
						console.log('❌ FantLab details failed:', detailsResponse.error);
						NotificationStore.addNotification({
							type: 'warning',
							title: 'Частичная загрузка',
							message: 'Не удалось загрузить детальную информацию, используются базовые данные',
						});
					}
				} catch (error) {
					console.error('❌ Ошибка загрузки деталей:', error);
					NotificationStore.addNotification({
						type: 'warning',
						title: 'Частичная загрузка',
						message: 'Не удалось загрузить детальную информацию, используются базовые данные',
					});
				}
			} else {
				console.log(
					'⏭️ Skipping FantLab details loading. Type:',
					goalData.type,
					'API:',
					goalData.apiSource,
					'Own DB:',
					goalData.isOwnDatabase
				);
			}

			// Преобразуем данные в формат, подходящий для IGoal
			const goalInfo: Partial<IGoal> & {
				imageUrl?: string;
				external_id?: string | number;
				externalType?: string;
				deadline?: string;
				isExistingGoal?: boolean;
				status?: string;
			} = {
				title: enhancedGoalData.title,
				description: enhancedGoalData.description || `Цель: ${enhancedGoalData.title}`,
				external_id: enhancedGoalData.externalId, // Сохраняем ID внешнего источника
				externalType: enhancedGoalData.type, // Тип внешнего источника
				complexity: selectComplexity[activeComplexity].value as IComplexity,
				// Добавляем изображение
				imageUrl: enhancedGoalData.imageUrl,
				// Добавляем оценочное время (если есть)
				estimatedTime: '',
				// Добавляем дедлайн (если есть)
				deadline: '',
				status: enhancedGoalData.source,
				// Добавляем дополнительные поля как отдельное поле
				additionalFields: enhancedGoalData.additionalFields,
			};

			// Добавляем дополнительные поля из API как отдельные свойства верхнего уровня
			if (enhancedGoalData.additionalFields) {
				const fields = enhancedGoalData.additionalFields;

				// Добавляем все дополнительные поля как отдельные свойства
				Object.keys(fields).forEach((key) => {
					const value = fields[key as keyof typeof fields];
					if (value !== undefined && value !== null) {
						// Не перезаписываем поле additionalFields
						if (key !== 'additionalFields') {
							(goalInfo as any)[key] = value;
						}
					}
				});
			}

			// Если цель из собственной базы данных, добавляем специальные поля
			if (enhancedGoalData.isOwnDatabase) {
				goalInfo.id = Number(enhancedGoalData.externalId);
				goalInfo.code = enhancedGoalData.goalCode;
				goalInfo.isExistingGoal = true; // Помечаем как существующую цель
			}

			// Если есть URL изображения, проверяем его доступность
			if (enhancedGoalData.imageUrl) {
				goalInfo.imageUrl = enhancedGoalData.imageUrl;
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
		} catch (error) {
			console.error('Ошибка при выборе цели:', error);
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Произошла ошибка при загрузке данных цели',
			});
		} finally {
			// Убираем индикатор загрузки
			setImageLoading((prev) => ({...prev, [String(goalData.externalId)]: false}));
		}
	};

	// Определяем название типа контента для отображения
	const getContentTypeName = (categoryEn: string): string => {
		const names: Record<string, string> = {
			books: 'книги',
			'cinema-art': 'фильмы',
			gaming: 'игры',
		};
		return names[categoryEn] || 'контент';
	};

	return (
		<div className={block()}>
			<h3 className={element('title')}>Найти готовую цель ({getContentTypeName(category)})</h3>
			<div className={element('search-panel')}>
				<div className={element('selectors')}>
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
						placeholder={`Введите название для поиска ${getContentTypeName(category)}...`}
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
							{/* Показываем разделитель между своими и внешними результатами */}
							{(() => {
								const ownResults = results.filter((item) => item.isOwnDatabase);
								const externalResults = results.filter((item) => !item.isOwnDatabase);

								return (
									<>
										{ownResults.length > 0 && (
											<>
												<div className={element('section-header')}>
													<h4>
														Цели из базы данных (если ваша цель уже есть в базе, просим вас выбирать её, а не
														создавать новую)
													</h4>
												</div>
												{ownResults.map((item) => (
													<div
														className={element('result-item', {'own-database': true})}
														key={`own-${item.externalId}`}
													>
														<div className={element('result-image')}>
															{item.imageUrl ? (
																<img
																	src={item.imageUrl}
																	alt={item.title}
																	onLoad={() => handleImageLoad(String(item.externalId))}
																	onError={() => handleImageError(String(item.externalId))}
																/>
															) : (
																<div className={element('no-image')}>
																	<Svg icon="mount" />
																</div>
															)}
														</div>
														<div className={element('result-details')}>
															<h4 className={element('result-title')}>{item.title}</h4>
															{item.description && (
																<p className={element('result-description')}>
																	{item.description.substring(0, 150)}...
																</p>
															)}
															<div className={element('result-meta')}>
																<span className={element('match-percentage')}>
																	Совпадение: {item.matchPercentage || item.match_percentage}%
																</span>
															</div>
															<Button
																theme="green"
																onClick={() => handleSelectGoal(item)}
																className={`${element('add-button')} ${
																	imageLoading[String(item.externalId)] ? 'disabled' : ''
																}`}
																icon="plus"
															>
																{imageLoading[String(item.externalId)]
																	? 'Проверка...'
																	: 'Добавить как цель'}
															</Button>
														</div>
													</div>
												))}

												{externalResults.length > 0 && (
													<div className={element('section-divider')}>
														<hr />
														<span>Результаты из внешних источников</span>
														<hr />
													</div>
												)}
											</>
										)}

										{externalResults.map((item) => (
											<div className={element('result-item')} key={`external-${item.type}-${item.externalId}`}>
												<div className={element('result-image')}>
													{item.imageUrl ? (
														<img
															src={item.imageUrl}
															alt={item.title}
															onLoad={() => handleImageLoad(String(item.externalId))}
															onError={() => handleImageError(String(item.externalId))}
														/>
													) : (
														<div className={element('no-image')}>
															<Svg icon="mount" />
														</div>
													)}
												</div>
												<div className={element('result-details')}>
													<h4 className={element('result-title')}>{item.title}</h4>
													{item.description && (
														<p className={element('result-description')}>
															{item.description.substring(0, 150)}...
														</p>
													)}
													<div className={element('result-meta')}>
														{item.type === 'cinema-art' && item.releaseDate && (
															<span>Год: {item.releaseDate.substring(0, 4)}</span>
														)}
														{item.type === 'book' && item.authors && (
															<span>Авторы: {item.authors.join(', ')}</span>
														)}
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
									</>
								);
							})()}
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
