import {FC, FormEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FileDrop} from 'react-file-drop';
import {useLocation, useNavigate} from 'react-router-dom';

import {AddGoal} from '@/components/AddGoal/AddGoal';
import {Button} from '@/components/Button/Button';
import {FieldCheckbox} from '@/components/FieldCheckbox/FieldCheckbox';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {ICategory, IGoal} from '@/typings/goal';
import {getAllCategories} from '@/utils/api/get/getCategories';
import {getSimilarGoals} from '@/utils/api/get/getSimilarGoals';
import {postCreateGoalList} from '@/utils/api/post/postCreateGoalList';
import {POST_WITH_RETRY} from '@/utils/fetch/requests';
import {debounce} from '@/utils/time/debounce';
import {selectComplexity} from '@/utils/values/complexity';

import '../GoalListItem/goal-list-item.scss';
import {GoalListItem} from '../GoalListItem/GoalListItem';
import {GoalSearchItem} from '../GoalSearchItem/GoalSearchItem';
import Select from '../Select/Select';
import './add-goal-list.scss';

// Ключ для хранения данных в localStorage
const CACHE_KEY = 'addGoalList_cachedData';

// Расширенный интерфейс для целей с поддержкой автопарсера
type IGoalExtended = any;

interface CachedGoalListData {
	title: string;
	description: string;
	activeComplexity: number | null;
	activeCategory: number | null;
	activeSubcategory: number | null;
	selectedGoals: IGoalExtended[];
	sourceName: string;
	sourceUrl: string;
	// Не кешируем image, так как FileList нельзя сериализовать
}

interface AddGoalListProps {
	className?: string;
}

export const AddGoalList: FC<AddGoalListProps> = (props) => {
	const {className} = props;
	const navigate = useNavigate();
	const location = useLocation();

	const [block, element] = useBem('add-goal-list', className);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [activeComplexity, setActiveComplexity] = useState<number | null>(null);
	const [activeCategory, setActiveCategory] = useState<number | null>(null);
	const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);
	const [image, setImage] = useState<File | null>(null);
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [subcategories, setSubcategories] = useState<ICategory[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showAddGoalForm, setShowAddGoalForm] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const formRef = useRef<HTMLDivElement>(null);

	// Состояния для работы с целями
	const [selectedGoals, setSelectedGoals] = useState<IGoalExtended[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<IGoal[]>([]);
	const [, setIsSearching] = useState(false);

	// Добавляем состояние для перехода к созданию цели
	const [canCreateGoal, setCanCreateGoal] = useState(false);

	// Состояния для автоматического добавления из текста
	const [autoText, setAutoText] = useState('');
	const [isParsingText, setIsParsingText] = useState(false);
	const [showAutoSection, setShowAutoSection] = useState(false);

	// Состояния для источника списка
	const [sourceName, setSourceName] = useState('');
	const [sourceUrl, setSourceUrl] = useState('');

	// Состояние для отслеживания редактируемой цели (только одна одновременно)
	const [editingGoalId, setEditingGoalId] = useState<number | string | null>(null);

	// Добавляем состояния для подтверждения целей
	const [hideConfirmedGoals, setHideConfirmedGoals] = useState(false);

	// Получаем только родительские категории для основного dropdown используя useMemo для оптимизации
	const parentCategories = useMemo(() => categories.filter((cat) => !cat.parentCategory), [categories]);

	// Восстанавливаем данные из кеша при загрузке компонента
	useEffect(() => {
		const loadCachedData = () => {
			try {
				const cachedData = localStorage.getItem(CACHE_KEY);
				if (cachedData) {
					const parsedData: CachedGoalListData = JSON.parse(cachedData);

					// Восстанавливаем состояние из кеша
					setTitle(parsedData.title);
					setDescription(parsedData.description);
					setActiveComplexity(parsedData.activeComplexity);
					setActiveCategory(parsedData.activeCategory);
					setActiveSubcategory(parsedData.activeSubcategory);
					setSelectedGoals(parsedData.selectedGoals);
					setSourceName(parsedData.sourceName || '');
					setSourceUrl(parsedData.sourceUrl || '');
				}
			} catch (error) {
				console.error('Ошибка при загрузке кешированных данных:', error);
				// В случае ошибки просто продолжаем с пустыми данными
			}
		};

		loadCachedData();
	}, []);

	// Сохраняем данные в кеш при изменении релевантных состояний
	useEffect(() => {
		// Не сохраняем данные, если все поля пустые
		if (
			!title &&
			!description &&
			activeComplexity === null &&
			activeCategory === null &&
			selectedGoals.length === 0 &&
			!sourceName &&
			!sourceUrl
		) {
			return;
		}

		const cacheData = () => {
			try {
				const dataToCache: CachedGoalListData = {
					title,
					description,
					activeComplexity,
					activeCategory,
					activeSubcategory,
					selectedGoals,
					sourceName,
					sourceUrl,
				};

				localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));
			} catch (error) {
				console.error('Ошибка при кешировании данных:', error);
			}
		};

		cacheData();
	}, [title, description, activeComplexity, activeCategory, activeSubcategory, selectedGoals, sourceName, sourceUrl]);

	// Обновляем эффект для проверки возможности создания цели
	useEffect(() => {
		setCanCreateGoal(activeCategory !== null);
	}, [activeCategory]);

	// Функция для очистки кеша
	const clearCache = () => {
		try {
			localStorage.removeItem(CACHE_KEY);
		} catch (error) {
			console.error('Ошибка при очистке кеша:', error);
		}
	};

	const handleTitleChange = (value: string) => {
		setTitle(value);
	};

	// Загрузка категорий при монтировании компонента
	useEffect(() => {
		const loadCategories = async () => {
			try {
				const data = await getAllCategories();
				if (data.success) {
					setCategories(data.data);
				}
			} catch (error) {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: 'Не удалось загрузить категории',
				});
			}
		};

		loadCategories();
	}, []);

	// Фильтрация подкатегорий при изменении категории
	useEffect(() => {
		if (activeCategory !== null && parentCategories.length > 0 && parentCategories[activeCategory]) {
			const selectedCategory = parentCategories[activeCategory];

			// Фильтруем подкатегории из общего списка категорий
			const filteredSubcategories = categories.filter(
				(cat: ICategory) => cat.parentCategory && cat.parentCategory.id === selectedCategory.id
			);

			setSubcategories(filteredSubcategories);
			setActiveSubcategory(null);
		} else {
			// Если категория не выбрана
			setSubcategories([]);
			setActiveSubcategory(null);
		}
	}, [activeCategory, parentCategories.length]);

	// Добавляем обработку параметра категории из URL
	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const categoryParam = params.get('category');

		if (categoryParam && parentCategories.length > 0) {
			// Находим индекс категории в массиве parentCategories
			const categoryIndex = parentCategories.findIndex((cat) => cat.nameEn === categoryParam);
			if (categoryIndex !== -1) {
				setActiveCategory(categoryIndex);
			}
		}
	}, [location.search, parentCategories.length]);

	// Функция для поиска целей с дебаунсом
	const debouncedSearch = useCallback(
		debounce(async (query: string) => {
			if (query.length < 3) {
				setSearchResults([]);
				setIsSearching(false);
				return;
			}

			try {
				// Используем тот же API, что и в AddGoal
				const response = await getSimilarGoals(query);

				if (response.success && response.data?.results) {
					// Фильтруем результаты, исключая уже выбранные цели
					const filteredResults = response.data.results.filter(
						(goal: IGoal) => !selectedGoals.some((selected) => selected.id === goal.id)
					);
					setSearchResults(filteredResults);
				}
			} catch (error) {
				console.error('Ошибка при поиске целей:', error);
			} finally {
				setIsSearching(false);
			}
		}, 500),
		[]
	);

	// Вызов поиска при изменении запроса
	useEffect(() => {
		if (searchQuery) {
			setIsSearching(true);
			debouncedSearch(searchQuery);
		} else {
			setSearchResults([]);
		}
	}, [searchQuery, debouncedSearch]);

	const onDrop = useCallback((acceptedFiles: FileList) => {
		if (acceptedFiles && acceptedFiles.length > 0) {
			setImage(acceptedFiles[0]);
		}
	}, []);

	const handleFileInputClick = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			onDrop(event.target.files);
		}
	};

	const removeImage = () => {
		setImage(null);
	};

	// Добавление цели из результатов поиска
	const addGoalFromSearch = (goal: IGoal) => {
		setSelectedGoals((prev) => [...prev, goal]);
		setSearchResults((prev) => prev.filter((item) => item.id !== goal.id));
		setSearchQuery('');
	};

	// Удаление выбранной цели
	const removeSelectedGoal = (goalId: number | string) => {
		setSelectedGoals((prev) => prev.filter((goal) => goal.id !== goalId));
	};

	// Обработчик успешного создания цели
	const handleGoalCreated = (newGoal: IGoal) => {
		setSelectedGoals((prev) => {
			const updated = [...prev, newGoal as IGoalExtended];
			return updated;
		});
		setShowAddGoalForm(false);

		NotificationStore.addNotification({
			type: 'success',
			title: 'Успех',
			message: 'Цель успешно добавлена в список',
		});
	};

	// Проверка наличия неподтвержденных целей
	const hasUnconfirmedGoals = () => {
		return selectedGoals.some((goal) => goal.isFromAutoParser && goal.needsConfirmation && !goal.isConfirmed && !goal.isRejected);
	};

	// Проверка наличие целей требующих редактирования
	const hasGoalsNeedingEdit = () => {
		return selectedGoals.some(
			(goal) =>
				goal.autoParserData?.status === 'created' &&
				(!goal.image || !goal.description || goal.description === `Цель: ${goal.title}`)
		);
	};

	// Предотвращаем отправку формы списка целей при создании новой цели
	const handleAddGoalSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		e.stopPropagation();
		// Обработка будет происходить внутри компонента AddGoal
	};

	// Отправка формы создания списка целей
	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!title || !description || activeComplexity === null || activeCategory === null || !image) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Заполните все обязательные поля',
			});
			return;
		}

		if (selectedGoals.length === 0) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Добавьте хотя бы одну цель в список',
			});
			return;
		}

		// Проверяем наличие неподтвержденных целей
		if (hasUnconfirmedGoals()) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Внимание',
				message: 'Есть цели, требующие подтверждения. Пожалуйста, подтвердите или отклоните их.',
			});
			return;
		}

		// Проверяем наличие целей требующих редактирования
		if (hasGoalsNeedingEdit()) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Внимание',
				message: 'Есть новые цели, требующие редактирования. Пожалуйста, отредактируйте их.',
			});
			return;
		}

		setIsLoading(true);

		try {
			const formData = new FormData();
			formData.append('title', title);
			formData.append('description', description);

			if (activeComplexity !== null) {
				formData.append('complexity', selectComplexity[activeComplexity].value);
			}

			if (activeSubcategory !== null && subcategories[activeSubcategory]) {
				formData.append('category', subcategories[activeSubcategory].id.toString());
			} else if (activeCategory !== null) {
				formData.append('category', parentCategories[activeCategory].id.toString());
			}

			formData.append('image', image as Blob);

			// Добавляем поля источника, если они заполнены
			if (sourceName.trim()) {
				formData.append('source_name', sourceName.trim());
			}
			if (sourceUrl.trim()) {
				formData.append('source_url', sourceUrl.trim());
			}

			// Обрабатываем выбранные цели - отдельно обычные и из автопарсера
			const regularGoals = selectedGoals.filter((goal) => !goal.isFromAutoParser);
			const autoParserGoals = selectedGoals.filter((goal) => goal.isFromAutoParser);

			// Добавляем ID обычных целей
			regularGoals.forEach((goal) => {
				formData.append('goals[]', goal.id.toString());
			});

			// Добавляем данные из автопарсера
			if (autoParserGoals.length > 0) {
				const updatedAutoParserData = autoParserGoals.map((goal) => {
					// Берём обновленные поля из цели и объединяем с исходными данными
					const baseData = {
						...goal.autoParserData,
					};
					// Перезаписываем обновленными полями
					if (goal.title) baseData.title = goal.title;
					if (goal.description) baseData.description = goal.description;
					if (goal.image) {
						if (typeof goal.image === 'string') {
							baseData.imageUrl = goal.image;
						} else {
							// Добавляем изображение как отдельное поле в FormData
							formData.append(`goal_image_${goal.id}`, goal.image);
							baseData.imageField = `goal_image_${goal.id}`;
						}
					}
					if (goal.estimatedTime) baseData.estimatedTime = goal.estimatedTime;
					if (goal.deadline) baseData.deadline = goal.deadline;
					if (goal.complexity) baseData.complexity = goal.complexity;

					return baseData;
				});
				formData.append('goals_data', JSON.stringify(updatedAutoParserData));
			}

			const response = await postCreateGoalList(formData);

			if (response.success) {
				// Очищаем кеш после успешного создания списка
				clearCache();

				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Список целей успешно создан',
				});
				navigate(`/list/${response.data.code}`);
			} else {
				// Упрощаем обработку ошибок, так как теперь бэкенд должен корректно обрабатывать любые названия
				throw new Error(response.error || 'Неизвестная ошибка');
			}
		} catch (error: unknown) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось создать список целей',
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (showAddGoalForm && formRef.current) {
			formRef.current.scrollIntoView({behavior: 'smooth', block: 'start'});
		}
	}, [showAddGoalForm]);

	// Получаем ID выбранной категории
	const getCategoryId = () => {
		if (activeCategory === null) return undefined;
		return typeof activeSubcategory === 'number' ? subcategories[activeSubcategory]?.id : parentCategories[activeCategory]?.id;
	};

	// Функция для разделения текста на части по строкам
	const splitTextIntoChunks = (text: string, chunkSize = 5): string[] => {
		const lines = text.split('\n').filter((line) => line.trim());
		const chunks: string[] = [];

		for (let i = 0; i < lines.length; i += chunkSize) {
			chunks.push(lines.slice(i, i + chunkSize).join('\n'));
		}

		return chunks;
	};

	// Функция для обработки одного чанка текста
	const processTextChunk = async (chunk: string, categoryId: string): Promise<any> => {
		try {
			const response = await POST_WITH_RETRY('goal-lists/parse-text', {
				body: {
					text: chunk,
					category_id: categoryId,
					prioritize_existing: true, // Новый параметр для приоритизации существующих целей
				},
				showSuccessNotification: false,
				showErrorNotification: false,
				auth: true,
			});
			return response;
		} catch (error) {
			console.error('Error processing chunk:', error);
			throw error;
		}
	};

	// Обработчик автоматического парсинга текста
	const handleParseText = async () => {
		if (!autoText.trim()) {
			NotificationStore.addNotification({
				type: 'warning',
				title: 'Внимание',
				message: 'Введите текст для анализа',
			});
			return;
		}

		const categoryId = getCategoryId();
		if (!categoryId) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Выберите категорию для автоматического поиска',
			});
			return;
		}

		setIsParsingText(true);
		const chunks = splitTextIntoChunks(autoText);
		let allGoals: any[] = [];

		try {
			// Используем последовательную обработку для соблюдения лимитов API
			const processChunksSequentially = async () => {
				await chunks.reduce(async (promise, chunk, index) => {
					await promise;
					const response = await processTextChunk(chunk, categoryId.toString());

					if (response.success && response.data.goals) {
						const newGoals = response.data.goals.filter((goal: any) => {
							const updatedGoal = {...goal};
							if (updatedGoal.matchPercentage > 100) {
								updatedGoal.matchPercentage = 100;
							}
							return !selectedGoals.some(
								(selected) =>
									selected.id === updatedGoal.goalCode || selected.title.toLowerCase() === updatedGoal.title.toLowerCase()
							);
						});

						allGoals = [...allGoals, ...newGoals];
					}

					const progress = Math.round(((index + 1) / chunks.length) * 100);
					NotificationStore.addNotification({
						type: 'success',
						title: 'Прогресс',
						message: `Обработано ${progress}% текста...`,
					});
				}, Promise.resolve());
			};

			await processChunksSequentially();

			// Преобразуем все найденные цели в формат IGoal
			const goalsToAdd: IGoalExtended[] = allGoals.map((goal: any) => {
				const confidence = goal.confidence || 0;
				const needsConfirmation = confidence < 0.97;

				const mappedGoal: IGoalExtended = {
					id: goal.goalCode || `temp_${Date.now()}_${Math.random()}`,
					title: goal.title,
					description: goal.description,
					image: goal.imageUrl,
					estimatedTime: goal.estimatedTime || '',
					deadline: goal.deadline || '',
					shortDescription: `${goal.description?.substring(0, 100)}...`,
					complexity: activeComplexity !== null ? selectComplexity[activeComplexity].value : 'medium',
					category: activeSubcategory !== null ? subcategories[activeSubcategory] : parentCategories[activeCategory!],
					isFromAutoParser: true,
					originalSearchText: goal.searchText,
					autoParserData: goal,
					needsConfirmation,
					isConfirmed: !needsConfirmation, // Автоматически подтверждаем цели с высоким confidence
					isRejected: false,
					replacementSearch: false,
					// Добавляем недостающие поля из IGoal
					code: goal.goalCode || `temp_${Date.now()}_${Math.random()}`,
					subcategory: null as any,
					totalAdded: 0,
					totalCompleted: 0,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					isCompleted: false,
					isPublic: true,
					additional: goal.additional || {},
					createdBy: null as any,
					rating: 0,
					viewsCount: 0,
					completedCount: 0,
					// Обязательные поля из IGoalExtended
					lists: [],
					listsCount: 0,
					completedByUser: false,
					addedByUser: false,
					favorites: [],
					favoritesCount: 0,
					isFavorite: false,
					createdByUser: false,
				};

				return mappedGoal;
			});

			setSelectedGoals((prev) => [...prev, ...goalsToAdd]);
			setAutoText('');

			NotificationStore.addNotification({
				type: 'success',
				title: 'Готово!',
				message: `Добавлено ${goalsToAdd.length} целей. ${allGoals.length !== goalsToAdd.length ? 'Дубликаты пропущены.' : ''}`,
			});
		} catch (error) {
			console.error('Error parsing text:', error);
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Произошла ошибка при анализе текста',
			});
		} finally {
			setIsParsingText(false);
		}
	};

	// Функция для завершения редактирования
	const finishEditingGoal = () => {
		setEditingGoalId(null);
	};

	// Функция для обработки редактирования цели
	const handleEditGoal = (goalId: number | string, editedGoal: any) => {
		setSelectedGoals((prev) => {
			const updated = prev.map((g) => (g.id === goalId ? {...g, ...editedGoal} : g));
			return updated;
		});
	};

	// Добавляем функцию для очистки целей
	const handleClearAllGoals = () => {
		if (window.confirm('Вы уверены, что хотите удалить все выбранные цели?')) {
			setSelectedGoals([]);
			NotificationStore.addNotification({
				type: 'success',
				title: 'Готово',
				message: 'Все выбранные цели удалены',
			});
		}
	};

	// Функция для подтверждения цели
	const confirmGoal = (goalId: number | string) => {
		setSelectedGoals((prev) =>
			prev.map((goal) =>
				goal.id === goalId ? {...goal, isConfirmed: true, needsConfirmation: false, replacementSearch: false} : goal
			)
		);
	};

	// Функция для отклонения цели
	const rejectGoal = (goalId: number | string) => {
		setSelectedGoals((prev) => prev.map((goal) => (goal.id === goalId ? {...goal, isRejected: true, replacementSearch: true} : goal)));
	};

	// Функция для закрытия поиска замены
	const closeReplacementSearch = (goalId: number | string) => {
		// Проверяем, была ли цель отклонена и не была изменена
		const goal = selectedGoals.find((g) => g.id === goalId);
		if (goal && goal.isRejected && !goal.isConfirmed) {
			// Удаляем отклоненную цель
			setSelectedGoals((prev) => prev.filter((g) => g.id !== goalId));
			NotificationStore.addNotification({
				type: 'warning',
				title: 'Цель удалена',
				message: 'Отклоненная цель была удалена из списка.',
			});
		} else {
			// Просто закрываем поиск замены
			setSelectedGoals((prev) => {
				return prev.map((goalSelected) =>
					goalSelected.id === goalId ? {...goalSelected, replacementSearch: false} : goalSelected
				);
			});
		}
	};

	// Функция для замены цели на новую из поиска
	const replaceGoalFromSearch = (oldGoalId: number | string, newGoalData: any) => {
		setSelectedGoals((prev) => {
			const index = prev.findIndex((goal) => goal.id === oldGoalId);
			if (index === -1) return prev;

			const oldGoal = prev[index];

			// Если выбрана существующая цель из базы данных
			if (newGoalData.isExistingGoal) {
				const newGoal: IGoalExtended = {
					...newGoalData,
					id: newGoalData.id || newGoalData.external_id,
					isFromAutoParser: false, // Помечаем как обычную цель
					originalSearchText: undefined,
					autoParserData: undefined,
					isConfirmed: true,
					needsConfirmation: false,
					replacementSearch: false,
					isRejected: false,
					// Добавляем недостающие поля из IGoal
					code: newGoalData.code || newGoalData.id || newGoalData.external_id,
					subcategory: newGoalData.subcategory || null,
					totalAdded: newGoalData.totalAdded || 0,
					totalCompleted: newGoalData.totalCompleted || 0,
					createdAt: newGoalData.createdAt || new Date().toISOString(),
					updatedAt: newGoalData.updatedAt || new Date().toISOString(),
					isCompleted: newGoalData.isCompleted || false,
					isPublic: newGoalData.isPublic !== undefined ? newGoalData.isPublic : true,
					additional: newGoalData.additional || {},
					createdBy: newGoalData.createdBy || null,
					rating: newGoalData.rating || 0,
					viewsCount: newGoalData.viewsCount || 0,
					completedCount: newGoalData.completedCount || 0,
					shortDescription: newGoalData.description ? `${newGoalData.description.substring(0, 100)}...` : newGoalData.title,
					// Обязательные поля
					lists: newGoalData.lists || [],
					listsCount: newGoalData.listsCount || 0,
					completedByUser: newGoalData.completedByUser || false,
					addedByUser: newGoalData.addedByUser || false,
					favorites: newGoalData.favorites || [],
					favoritesCount: newGoalData.favoritesCount || 0,
					isFavorite: newGoalData.isFavorite || false,
					createdByUser: newGoalData.createdByUser || false,
				} as IGoalExtended;

				const newArray = [...prev];
				newArray[index] = newGoal;
				return newArray;
			}
			// Если выбрана внешняя цель, создаем новую цель с данными из автопарсера
			const newGoal: IGoalExtended = {
				...newGoalData,
				id: newGoalData.id || `temp_${Date.now()}_${Math.random()}`,
				isFromAutoParser: true,
				originalSearchText: oldGoal.originalSearchText,
				autoParserData: {
					...newGoalData,
					confidence: 1.0, // Помечаем как точное совпадение
					status: 'external',
					apiSource: newGoalData.externalType,
				},
				isConfirmed: true,
				needsConfirmation: false,
				replacementSearch: false,
				isRejected: false,
				// Добавляем недостающие поля из IGoal
				code: newGoalData.code || `temp_${Date.now()}_${Math.random()}`,
				subcategory: newGoalData.subcategory || null,
				totalAdded: 0,
				totalCompleted: 0,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				isCompleted: false,
				isPublic: true,
				additional: newGoalData.additional || {},
				createdBy: null,
				rating: 0,
				viewsCount: 0,
				completedCount: 0,
				shortDescription: newGoalData.description ? `${newGoalData.description.substring(0, 100)}...` : newGoalData.title,
				// Обязательные поля
				lists: [],
				listsCount: 0,
				totalLists: 0,
				totalComments: 0,
				addedFromList: false,
				isCanEdit: true,
				userVisitedLocation: false,
				completedByUser: false,
				addedByUser: false,
				favorites: [],
				favoritesCount: 0,
				isFavorite: false,
				createdByUser: false,
			} as IGoalExtended;

			const newArray = [...prev];
			newArray[index] = newGoal;
			return newArray;
		});
	};

	// Получаем отфильтрованные цели для отображения
	const getFilteredGoals = () => {
		if (!hideConfirmedGoals) {
			return selectedGoals;
		}

		return selectedGoals.filter((goal) => {
			// Показываем неподтвержденные цели
			if (goal.needsConfirmation && !goal.isConfirmed) {
				return true;
			}
			// Показываем цели требующие редактирования
			if (
				goal.autoParserData?.status === 'created' &&
				(!goal.image || !goal.description || goal.description === `Цель: ${goal.title}`)
			) {
				return true;
			}
			// Скрываем подтвержденные
			return false;
		});
	};

	return (
		<form className={block()} onSubmit={onSubmit}>
			<div className={element('container')}>
				<div className={element('wrapper-title')}>
					<Title tag="h1" className={element('title')}>
						Создание списка целей
					</Title>
					<Button size="small" type="Link" theme="blue" icon="plus" href="/goals/create">
						Добавить цель
					</Button>
				</div>

				{/* Объединенный интерфейс */}
				<div className={element('content')}>
					<div className={element('image-section')}>
						<p className={element('field-title')}>Изображение списка *</p>
						{!image ? (
							<div className={element('dropzone')}>
								<FileDrop onDrop={(files) => files && onDrop(files)}>
									<div
										className={element('upload-placeholder')}
										onClick={handleFileInputClick}
										role="button"
										tabIndex={0}
										aria-label="Добавить изображение"
										onKeyPress={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												handleFileInputClick();
											}
										}}
									>
										<input
											type="file"
											ref={fileInputRef}
											style={{display: 'none'}}
											onChange={handleFileChange}
											accept="image/*"
										/>
										<Svg icon="mount" className={element('upload-icon')} />
										<p>Перетащите изображение сюда или кликните для выбора (обязательно)</p>
									</div>
								</FileDrop>
							</div>
						) : (
							<div className={element('image-preview')}>
								<img src={URL.createObjectURL(image)} alt="Предпросмотр" className={element('preview')} />
								<button
									type="button"
									className={element('remove-image')}
									onClick={removeImage}
									aria-label="Удалить изображение"
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											removeImage();
										}
									}}
								>
									<Svg icon="cross" />
								</button>
							</div>
						)}
					</div>

					<div className={element('form')}>
						<div className={element('field-wrapper')}>
							<FieldInput
								placeholder="Введите название списка целей"
								id="goal-list-title"
								text="Название списка *"
								value={title}
								setValue={handleTitleChange}
								className={element('field')}
								required
							/>
						</div>

						<Select
							className={element('field')}
							placeholder="Выберите категорию"
							options={parentCategories.map((cat) => ({name: cat.name, value: cat.nameEn}))}
							activeOption={activeCategory}
							onSelect={setActiveCategory}
							text="Категория *"
						/>

						{activeCategory !== null && subcategories.length > 0 && (
							<Select
								className={element('field')}
								placeholder="Выберите подкатегорию (необязательно)"
								options={subcategories.map((sub) => ({name: sub.name, value: sub.nameEn}))}
								activeOption={activeSubcategory}
								onSelect={setActiveSubcategory}
								text="Подкатегория"
							/>
						)}

						<Select
							className={element('field')}
							placeholder="Выберите сложность"
							options={selectComplexity}
							activeOption={activeComplexity}
							onSelect={setActiveComplexity}
							text="Сложность *"
						/>

						<FieldInput
							placeholder="Опишите список целей подробно"
							id="goal-list-description"
							text="Описание *"
							value={description}
							setValue={setDescription}
							className={element('field')}
							type="textarea"
							required
						/>

						{/* Поля источника списка */}
						<div className={element('source-section')}>
							<h3 className={element('source-title')}>Источник списка (необязательно)</h3>
							<div className={element('source-fields')}>
								<FieldInput
									placeholder="Например: 100 лучших книг по версии BBC"
									id="goal-list-source-name"
									text="Название источника"
									value={sourceName}
									setValue={setSourceName}
									className={element('field')}
								/>
								<FieldInput
									placeholder="https://example.com/list"
									id="goal-list-source-url"
									text="Ссылка на источник"
									value={sourceUrl}
									setValue={setSourceUrl}
									className={element('field')}
								/>
							</div>
						</div>

						<div className={element('goals-section')}>
							<Title tag="h2" className={element('subtitle')}>
								Добавление целей в список
							</Title>

							{/* Поиск существующих целей */}
							<div className={element('search-container')}>
								<FieldInput
									placeholder="Поиск существующих целей"
									id="goal-search"
									text="Поиск целей"
									value={searchQuery}
									setValue={setSearchQuery}
									className={element('search-field')}
									iconBegin="search"
								/>

								{searchResults.length > 0 && (
									<div className={element('search-results')}>
										{searchResults.map((goal) => (
											<GoalSearchItem key={goal.id} goal={goal} onAdd={addGoalFromSearch} />
										))}
									</div>
								)}
							</div>

							{/* Автоматическое добавление из текста */}
							<div className={element('auto-add-section')}>
								<div className={element('auto-add-header')}>
									<h3 className={element('auto-add-title')}>Автоматическое добавление из списка</h3>
									<Button
										theme="blue-light"
										size="small"
										onClick={() => setShowAutoSection(!showAutoSection)}
										className={element('auto-toggle-btn')}
										// icon={showAutoSection ? 'chevron-up' : 'chevron-down'}
										icon="edit"
									>
										{showAutoSection ? 'Скрыть' : 'Показать'}
									</Button>
								</div>

								{showAutoSection && (
									<div className={element('auto-add-content')}>
										<div className={element('auto-info')}>
											<Svg icon="info" className={element('auto-info-icon')} />
											<p className={element('auto-info-text')}>
												Вставьте список целей (книги, фильмы, игры) — система автоматически найдет соответствия и
												добавит их к уже выбранным целям.
											</p>
										</div>

										<FieldInput
											id="auto-goals-text"
											type="textarea"
											text="Список целей"
											value={autoText}
											setValue={setAutoText}
											placeholder={[
												'Пример:',
												'1. Властелин колец, Дж. Р. Р. Толкин',
												'2. Гарри Поттер, Дж. К. Роулинг',
												'3. 1984, Джордж Оруэлл',
												'',
												'Или просто:',
												'Властелин колец',
												'Гарри Поттер',
												'1984',
											].join('\n')}
											className={element('auto-textarea')}
										/>

										<Button
											theme="blue-light"
											onClick={handleParseText}
											active={isParsingText || !autoText.trim() || activeCategory === null}
											className={element('auto-parse-btn')}
											icon="plus"
										>
											{isParsingText ? 'Обработка...' : 'Добавить цели из списка'}
										</Button>
									</div>
								)}
							</div>

							<div className={element('selected-goals')}>
								<div className={element('selected-goals-header')}>
									<h3 className={element('section-title')}>Выбранные цели ({selectedGoals.length})</h3>
									<div className={element('goals-controls')}>
										{selectedGoals.some((goal) => goal.isFromAutoParser) && (
											<FieldCheckbox
												id="hide-confirmed"
												text="Скрыть подтвержденные"
												checked={hideConfirmedGoals}
												setChecked={setHideConfirmedGoals}
												className={element('hide-checkbox')}
											/>
										)}
										<Button
											theme="blue-light"
											className={element('clear-btn')}
											onClick={handleClearAllGoals}
											size="small"
										>
											Очистить все цели
										</Button>
									</div>
								</div>
								{selectedGoals.length > 0 ? (
									<div className={element('goals-list')}>
										{getFilteredGoals().map((goal) => (
											<GoalListItem
												key={goal.originalSearchText}
												goal={goal}
												onRemove={removeSelectedGoal}
												onEdit={handleEditGoal}
												onStartEdit={setEditingGoalId}
												onCancelEdit={finishEditingGoal}
												onConfirm={confirmGoal}
												onReject={rejectGoal}
												onReplaceFromSearch={replaceGoalFromSearch}
												onCloseReplacementSearch={closeReplacementSearch}
												isEditing={editingGoalId === goal.id}
												isOtherEditing={editingGoalId !== null && editingGoalId !== goal.id}
												initialCategory={
													activeSubcategory !== null
														? subcategories[activeSubcategory]
														: parentCategories[activeCategory!]
												}
												preloadedCategories={categories}
												preloadedSubcategories={subcategories}
											/>
										))}
									</div>
								) : (
									<div className={element('empty-message')}>
										Вы еще не добавили ни одной цели. Воспользуйтесь поиском или создайте новую цель.
									</div>
								)}
							</div>

							<div className={element('add-new-goal')}>
								{!showAddGoalForm ? (
									<Button
										theme="blue-light"
										className={element('add-goal-btn')}
										onClick={() => {
											if (canCreateGoal) {
												// Закрываем редактирование других целей
												finishEditingGoal();
												setShowAddGoalForm(true);
											} else {
												NotificationStore.addNotification({
													type: 'warning',
													title: 'Внимание',
													message: 'Для создания цели необходимо сначала выбрать категорию списка',
												});
											}
										}}
										type="button"
										icon="plus"
									>
										Создать новую цель
									</Button>
								) : (
									<div className={element('new-goal-form')} ref={formRef}>
										<Title tag="h3" className={element('form-title')}>
											Создание новой цели
										</Title>

										<div className={element('embedded-add-goal-wrapper')}>
											<AddGoal
												className={element('embedded-add-goal')}
												onGoalCreated={handleGoalCreated}
												hideNavigation
												noForm
												onSubmitForm={handleAddGoalSubmit}
												initialCategory={
													activeSubcategory !== null
														? subcategories[activeSubcategory]
														: parentCategories[activeCategory!]
												}
												lockCategory // Блокируем выбор категории
												preloadedCategories={categories}
											/>
										</div>

										<div className={element('form-buttons')}>
											<Button
												theme="blue-light"
												className={element('cancel-btn')}
												onClick={() => setShowAddGoalForm(false)}
												type="button"
											>
												Отмена
											</Button>
										</div>
									</div>
								)}
							</div>
						</div>

						<div className={element('btns-wrapper')}>
							<Button theme="blue-light" className={element('btn')} onClick={() => navigate(-1)} type="button">
								Отмена
							</Button>
							<Button theme="blue" className={element('btn')} typeBtn="submit">
								{isLoading ? 'Создание...' : 'Создать список целей'}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</form>
	);
};
