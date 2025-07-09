import {format} from 'date-fns';
import {FC, FormEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FileDrop} from 'react-file-drop';
import {useLocation, useNavigate} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {DatePicker} from '@/components/DatePicker/DatePicker';
import {ExternalGoalSearch} from '@/components/ExternalGoalSearch/ExternalGoalSearch';
import {FieldCheckbox} from '@/components/FieldCheckbox/FieldCheckbox';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {NotificationStore} from '@/store/NotificationStore';
import {ICategory, IGoal, ILocation} from '@/typings/goal';
import {getAllCategories} from '@/utils/api/get/getCategories';
import {getSimilarGoals} from '@/utils/api/get/getSimilarGoals';
import {postCreateGoal} from '@/utils/api/post/postCreateGoal';
import {mapApi} from '@/utils/mapApi';
import {debounce} from '@/utils/time/debounce';
import {selectComplexity} from '@/utils/values/complexity';

import {Loader} from '../Loader/Loader';
import Select from '../Select/Select';
import {SimilarGoalItem} from '../SimilarGoalItem/SimilarGoalItem';
import {Title} from '../Title/Title';

import './add-goal.scss';

interface AddGoalProps {
	className?: string;
	onGoalCreated?: (goal: IGoal) => void;
	hideNavigation?: boolean;
	noForm?: boolean;
	onSubmitForm?: (e: FormEvent<HTMLFormElement>) => void;
	initialCategory?: ICategory;
	lockCategory?: boolean;
	initialCategoryParam?: string;
	preloadedCategories?: ICategory[];
}

export const AddGoal: FC<AddGoalProps> = (props) => {
	const {
		className,
		onGoalCreated,
		hideNavigation = false,
		noForm = false,
		onSubmitForm,
		initialCategory,
		lockCategory = false,
		initialCategoryParam,
		preloadedCategories,
	} = props;
	const navigate = useNavigate();
	const location = useLocation();

	const [block, element] = useBem('add-goal', className);

	// Основные поля
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [activeComplexity, setActiveComplexity] = useState<number | null>(null);
	const [deadline, setDeadline] = useState('');
	const [estimatedTime, setEstimatedTime] = useState('');

	// Изображение
	const [image, setImage] = useState<File | null>(null);
	const [imageUrl, setImageUrl] = useState<string | null>(null);

	// Категории
	const [activeCategory, setActiveCategory] = useState<number | null>(null);
	const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);
	const [categories, setCategories] = useState<ICategory[]>([]);

	// Место
	const [selectedGoalLocation, setSelectedGoalLocation] = useState<Partial<ILocation> | null>(null);

	// Внешние поля
	const [externalGoalFields, setExternalGoalFields] = useState<any>(null);

	// Состояния загрузки
	const [isLoading, setIsLoading] = useState(false);

	// Регулярность
	const [isRegular, setIsRegular] = useState(false);
	const [regularFrequency, setRegularFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
	const [weeklyFrequency, setWeeklyFrequency] = useState(3);
	const [durationType, setDurationType] = useState<'days' | 'weeks' | 'until_date' | 'indefinite'>('days');
	const [durationValue, setDurationValue] = useState(30);
	const [regularEndDate, setRegularEndDate] = useState('');
	const [allowSkipDays, setAllowSkipDays] = useState(0);
	const [resetOnSkip, setResetOnSkip] = useState(false);

	// Похожие цели
	const [similarGoals, setSimilarGoals] = useState<IGoal[]>([]);
	const [showSimilarGoals, setShowSimilarGoals] = useState(false);

	// Остальные локальные состояния
	const [subcategories, setSubcategories] = useState<ICategory[]>([]);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const {setWindow, setModalProps, setIsOpen} = ModalStore;

	// Получаем только родительские категории для основного dropdown используя useMemo для оптимизации
	const parentCategories = useMemo(() => categories.filter((cat: ICategory) => !cat.parentCategory), [categories]);

	// Функция для сброса формы
	const resetForm = () => {
		setTitle('');
		setDescription('');
		setActiveComplexity(null);
		setDeadline('');
		setEstimatedTime('');
		setImage(null);
		setImageUrl(null);
		setActiveCategory(null);
		setActiveSubcategory(null);
		setSelectedGoalLocation(null);
		setExternalGoalFields(null);
		setIsRegular(false);
		setRegularFrequency('daily');
		setWeeklyFrequency(3);
		setDurationType('days');
		setDurationValue(30);
		setRegularEndDate('');
		setAllowSkipDays(0);
		setResetOnSkip(false);
		setSimilarGoals([]);
		setShowSimilarGoals(false);
	};

	// Обработчики для похожих целей
	const handleTitleFocus = () => {
		if (similarGoals.length > 0) {
			setShowSimilarGoals(true);
		}
	};

	const handleTitleBlur = () => {
		// Используем setTimeout чтобы дать время на клик по элементу
		setTimeout(() => {
			setShowSimilarGoals(false);
		}, 200);
	};

	const fillFormWithGoalData = (goal: IGoal) => {
		setTitle(goal.title);
		setDescription(goal.description || '');
		setEstimatedTime(goal.estimatedTime || '');

		// Если у цели есть сложность, находим ее индекс
		if (goal.complexity) {
			const complexityIndex = selectComplexity.findIndex((item) => item.value === goal.complexity);
			if (complexityIndex !== -1) {
				setActiveComplexity(complexityIndex);
			}
		}

		// Если у цели есть категория, находим ее индекс
		if (goal.category) {
			// Определяем, является ли категория подкатегорией
			const goalCategory = categories.find((cat: ICategory) => cat.id === goal.category?.id);

			if (goalCategory) {
				if (goalCategory.parentCategory) {
					// Если это подкатегория, находим её родительскую категорию
					const parentCategoryIndex = parentCategories.findIndex((cat: ICategory) => cat.id === goalCategory.parentCategory?.id);
					if (parentCategoryIndex !== -1) {
						setActiveCategory(parentCategoryIndex);

						// Фильтруем подкатегории из общего списка
						const filteredSubcategories = categories.filter(
							(cat: ICategory) => cat.parentCategory && cat.parentCategory.id === goalCategory.parentCategory?.id
						);
						setSubcategories(filteredSubcategories);

						// Находим индекс подкатегории в отфильтрованном списке
						const subcategoryIndex = filteredSubcategories.findIndex((sub: ICategory) => sub.id === goalCategory.id);
						if (subcategoryIndex !== -1) {
							setActiveSubcategory(subcategoryIndex);
						}
					}
				} else {
					// Если это родительская категория
					const categoryIndex = parentCategories.findIndex((cat: ICategory) => cat.id === goalCategory.id);
					if (categoryIndex !== -1) {
						setActiveCategory(categoryIndex);
					}
				}
			}
		}

		// Сохраняем URL изображения, если он есть
		if (goal.image) {
			setImageUrl(goal.image);
			setImage(null); // Сбрасываем локально загруженное изображение
		}

		setShowSimilarGoals(false);
	};

	// Обработчик выбора места с карты
	const handleLocationFromPicker = (selectedLocation: Partial<ILocation>) => {
		// Создаем полный объект ILocation (частичный, id будет создан на сервере)
		const fullLocation: Partial<ILocation> = {
			name: selectedLocation.name || '',
			longitude: selectedLocation.longitude || 0,
			latitude: selectedLocation.latitude || 0,
			country: selectedLocation.country || '',
			city: selectedLocation.city || undefined,
			description: selectedLocation.description || undefined,
			place_type: 'other',
			address: undefined,
			created_at: new Date().toISOString(),
		};
		setSelectedGoalLocation(fullLocation);
		setIsOpen(false);
	};

	// Функция для сброса выбранного места
	const clearSelectedLocation = () => {
		setSelectedGoalLocation(null);
	};

	// Обработчик изменения названия цели
	const handleTitleChange = (value: string) => {
		setTitle(value);
	};

	// Обработчик изменения предполагаемого времени
	const handleEstimatedTimeChange = (value: string) => {
		// Разрешаем цифры, двоеточия, пробелы и русские буквы
		const cleanValue = value.replace(/[^0-9:дчмдней ыячасовминут\s]/gi, '');

		// Проверяем различные форматы:
		// 1. HH:MM
		const timePattern = /^(\d{0,2}):?(\d{0,2})$/;
		// 2. Простое число (часы)
		const simpleNumberPattern = /^\d+$/;
		// 3. X дней, X д, X дня
		const daysPattern = /^(\d+)\s*(д|дн|дня|дней)?$/i;
		// 4. X часов, X ч
		const hoursPattern = /^(\d+)\s*(ч|час|часа|часов)?$/i;
		// 5. X минут, X м, X мин
		const minutesPattern = /^(\d+)\s*(м|мин|минут|минуты)?$/i;
		// 6. Комбинированные форматы: "3д5ч", "3д 5ч", "3д5 ч", "3д 5 ч"
		const combinedPattern = /^(\d+)\s*д\s*(\d+)?\s*ч?$/i;
		// 7. Более сложные комбинации с минутами: "3д5ч30м"
		const fullCombinedPattern = /^(\d+)?\s*д?\s*(\d+)?\s*ч?\s*(\d+)?\s*м?$/i;

		// Разрешаем ввод, если поле пустое или соответствует одному из паттернов
		if (
			cleanValue === '' ||
			timePattern.test(cleanValue) ||
			simpleNumberPattern.test(cleanValue) ||
			daysPattern.test(cleanValue) ||
			hoursPattern.test(cleanValue) ||
			minutesPattern.test(cleanValue) ||
			combinedPattern.test(cleanValue) ||
			fullCombinedPattern.test(cleanValue) ||
			cleanValue.includes('д') ||
			cleanValue.includes('ч') ||
			cleanValue.includes('м')
		) {
			setEstimatedTime(cleanValue);
		}
	};

	// Функция для преобразования времени в стандартный формат HH:MM
	const convertTimeToStandardFormat = (timeString: string): string => {
		if (!timeString) return '';

		// Если уже в формате HH:MM, возвращаем как есть
		const timePattern = /^(\d{1,2}):(\d{1,2})$/;
		if (timePattern.test(timeString)) {
			const match = timeString.match(timePattern);
			if (match) {
				const hours = match[1].padStart(2, '0');
				const minutes = match[2].padStart(2, '0');
				return `${hours}:${minutes}`;
			}
		}

		// Простое число - считаем часами
		const simpleNumberPattern = /^\d+$/;
		if (simpleNumberPattern.test(timeString)) {
			const hours = parseInt(timeString, 10);
			return `${hours.toString().padStart(2, '0')}:00`;
		}

		// Комбинированные форматы: "3д5ч", "3д 5ч", "3д5 ч", "3д 5 ч", "3д5ч30м"
		const fullCombinedPattern = /^(\d+)?\s*д?\s*(\d+)?\s*ч?\s*(\d+)?\s*м?$/i;
		const fullMatch = timeString.match(fullCombinedPattern);
		if (fullMatch && (fullMatch[1] || fullMatch[2] || fullMatch[3])) {
			const days = fullMatch[1] ? parseInt(fullMatch[1], 10) : 0;
			const hours = fullMatch[2] ? parseInt(fullMatch[2], 10) : 0;
			const minutes = fullMatch[3] ? parseInt(fullMatch[3], 10) : 0;

			const totalHours = days * 24 + hours + Math.floor(minutes / 60);
			const remainingMinutes = minutes % 60;

			return `${totalHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
		}

		// Преобразуем дни в часы (1 день = 24 часа)
		const daysPattern = /^(\d+)\s*(д|дн|дня|дней)$/i;
		const daysMatch = timeString.match(daysPattern);
		if (daysMatch) {
			const days = parseInt(daysMatch[1], 10);
			const totalHours = days * 24;
			return `${totalHours.toString().padStart(2, '0')}:00`;
		}

		// Преобразуем часы
		const hoursPattern = /^(\d+)\s*(ч|час|часа|часов)$/i;
		const hoursMatch = timeString.match(hoursPattern);
		if (hoursMatch) {
			const hours = parseInt(hoursMatch[1], 10);
			return `${hours.toString().padStart(2, '0')}:00`;
		}

		// Преобразуем минуты
		const minutesPattern = /^(\d+)\s*(м|мин|минут|минуты)$/i;
		const minutesMatch = timeString.match(minutesPattern);
		if (minutesMatch) {
			const minutes = parseInt(minutesMatch[1], 10);
			const hours = Math.floor(minutes / 60);
			const remainingMinutes = minutes % 60;
			return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
		}

		return timeString; // Возвращаем исходную строку, если не удалось распознать формат
	};

	// Загрузка категорий при монтировании компонента
	useEffect(() => {
		const loadCategories = async () => {
			try {
				// Если переданы готовые категории, используем их
				if (preloadedCategories) {
					setCategories(preloadedCategories);
				} else {
					// Иначе загружаем категории с сервера
					const data = await getAllCategories();
					if (data.success) {
						setCategories(data.data);
					}
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
	}, [preloadedCategories]);

	const openLocationPicker = () => {
		setIsOpen(true);
		setWindow('goal-map-add');
		setModalProps({
			onLocationSelect: handleLocationFromPicker,
			initialLocation: selectedGoalLocation || undefined,
		});
	};

	// Фильтрация подкатегорий при изменении категории
	useEffect(() => {
		if (activeCategory !== null && parentCategories.length > 0 && parentCategories[activeCategory]) {
			const selectedCategory = parentCategories[activeCategory];

			// Фильтруем подкатегории из общего списка категорий
			const filteredSubcategories = categories.filter(
				(cat: ICategory) => cat.parentCategory && cat.parentCategory.id === selectedCategory.id
			);

			setSubcategories(filteredSubcategories);

			// Сбрасываем подкатегорию только если не устанавливается initialCategory
			if (!initialCategory || !initialCategory.parentCategory) {
				setActiveSubcategory(null);
			}
		} else {
			// Если категория не выбрана
			setSubcategories([]);
			setActiveSubcategory(null);
		}
	}, [activeCategory, parentCategories.length]);

	// Добавляем эффект для установки начальной категории из props
	useEffect(() => {
		if (initialCategory && categories.length > 0 && parentCategories.length > 0) {
			// Если передана подкатегория, ищем её родительскую категорию
			if (initialCategory.parentCategory) {
				const parentIndex = parentCategories.findIndex((cat) => cat.id === initialCategory.parentCategory?.id);

				if (parentIndex !== -1) {
					setActiveCategory(parentIndex);

					// Фильтруем подкатегории из общего списка
					const filteredSubcategories = categories.filter(
						(cat: ICategory) => cat.parentCategory && cat.parentCategory.id === initialCategory.parentCategory?.id
					);
					setSubcategories(filteredSubcategories);

					// Ищем индекс подкатегории в отфильтрованном списке
					const subcategoryIndex = filteredSubcategories.findIndex((sub: ICategory) => sub.id === initialCategory.id);

					if (subcategoryIndex !== -1) {
						// Добавляем небольшую задержку для обеспечения корректной установки
						setTimeout(() => {
							setActiveSubcategory(subcategoryIndex);
						}, 100);
					} else {
						console.warn('Подкатегория не найдена:', initialCategory);
					}
				} else {
					console.warn('Родительская категория не найдена:', initialCategory.parentCategory);
				}
			} else {
				// Если передана основная категория
				const categoryIndex = parentCategories.findIndex((cat) => cat.id === initialCategory.id);

				if (categoryIndex !== -1) {
					setActiveCategory(categoryIndex);
				} else {
					console.warn('Основная категория не найдена:', initialCategory);
				}
			}
		}
	}, [initialCategory?.id, parentCategories.length, categories.length]);

	// Добавляем эффект для получения категории из URL параметра
	useEffect(() => {
		// Обрабатываем параметр initialCategoryParam, если он передан
		if (initialCategoryParam && parentCategories.length > 0) {
			const categoryIndex = parentCategories.findIndex((cat) => cat.nameEn === initialCategoryParam);
			if (categoryIndex !== -1) {
				setActiveCategory(categoryIndex);
			}
		}
		// Иначе продолжаем обрабатывать параметр category из URL
		else {
			const params = new URLSearchParams(location.search);
			const categoryParam = params.get('category');

			if (categoryParam && parentCategories.length > 0) {
				const categoryIndex = parentCategories.findIndex((cat) => cat.nameEn === categoryParam);
				if (categoryIndex !== -1) {
					setActiveCategory(categoryIndex);
				}
			}
		}
	}, [initialCategoryParam, location.search, parentCategories.length]);

	// Функция для поиска похожих целей с дебаунсом
	const debouncedSearchSimilarGoals = useCallback(
		debounce(async (query: string) => {
			if (query.length < 3) {
				setSimilarGoals([]);
				setShowSimilarGoals(false);
				return;
			}

			try {
				const response = await getSimilarGoals(query);

				if (response.success && response.data?.results) {
					setSimilarGoals(response.data.results.slice(0, 5)); // Ограничиваем до 5 результатов
				}
			} catch (error) {
				console.error('Ошибка при поиске похожих целей:', error);
			}
		}, 500),
		[]
	);

	// Вызов поиска при изменении названия цели
	useEffect(() => {
		if (title) {
			debouncedSearchSimilarGoals(title);
		} else {
			setSimilarGoals([]);
			setShowSimilarGoals(false);
		}
	}, [title, debouncedSearchSimilarGoals]);

	const onDrop = useCallback((acceptedFiles: FileList) => {
		if (acceptedFiles && acceptedFiles.length > 0) {
			setImage(acceptedFiles[0]);
			setImageUrl(null); // Сбрасываем URL изображения при загрузке локального файла
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

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		// Если передан внешний обработчик, используем его
		if (onSubmitForm) {
			onSubmitForm(e);
			return;
		}

		if (!title || activeComplexity === null || activeCategory === null || (!image && !imageUrl)) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Заполните все обязательные поля',
			});
			return;
		}

		setIsLoading(true);

		try {
			const formData = new FormData();
			formData.append('title', title);
			if (description) {
				formData.append('description', description);
			}

			if (activeComplexity !== null) {
				formData.append('complexity', selectComplexity[activeComplexity].value);
			}

			// Если выбрана подкатегория, используем её ID
			if (activeSubcategory !== null && subcategories[activeSubcategory]) {
				formData.append('category', subcategories[activeSubcategory].id.toString());
			}
			// Иначе используем ID основной категории
			else if (activeCategory !== null) {
				formData.append('category', parentCategories[activeCategory].id.toString());
			}

			// Если есть локальное изображение, добавляем его в formData
			if (image) {
				formData.append('image', image as Blob);
			}
			// Если есть URL изображения, добавляем его в formData
			else if (imageUrl) {
				formData.append('image_url', imageUrl);
			}

			// Если задан дедлайн, добавляем его в formData
			if (deadline) {
				formData.append('deadline', deadline);
			}

			// Если задано предполагаемое время, добавляем его в formData
			if (estimatedTime) {
				const standardTime = convertTimeToStandardFormat(estimatedTime);
				formData.append('estimated_time', standardTime);
			}

			// Если выбрано место, обрабатываем его
			let locationId = null;
			if (selectedGoalLocation) {
				if (!selectedGoalLocation.id) {
					// Создаем новое место
					try {
						const newLocation = await mapApi.createLocation({
							name: selectedGoalLocation.name! || title,
							longitude: selectedGoalLocation.longitude!,
							latitude: selectedGoalLocation.latitude!,
							country: selectedGoalLocation.country!,
							city: selectedGoalLocation.city,
							description: selectedGoalLocation.description,
							place_type: selectedGoalLocation.place_type || 'other',
						});
						locationId = newLocation.id;
					} catch (error) {
						NotificationStore.addNotification({
							type: 'error',
							title: 'Ошибка',
							message: error instanceof Error ? error.message : 'Не удалось создать место',
						});
						return;
					}
				} else {
					locationId = selectedGoalLocation.id;
				}
			}

			// Если создано место, добавляем его ID
			if (locationId) {
				formData.append('location_id', locationId.toString());
			}

			// Добавляем данные о регулярности, если это регулярная цель
			if (isRegular) {
				formData.append('is_regular', 'true');
				formData.append('regular_frequency', regularFrequency);

				if (regularFrequency === 'weekly') {
					formData.append('weekly_frequency', weeklyFrequency.toString());
				}

				formData.append('duration_type', durationType);

				if (durationType === 'days' || durationType === 'weeks') {
					formData.append('duration_value', durationValue.toString());
				}

				if (durationType === 'until_date' && regularEndDate) {
					formData.append('end_date', regularEndDate);
				}

				formData.append('allow_skip_days', allowSkipDays.toString());
				formData.append('reset_on_skip', resetOnSkip.toString());
			}

			// Добавляем дополнительные поля из внешних API, если они есть
			if (externalGoalFields) {
				Object.entries(externalGoalFields).forEach(([key, value]) => {
					if (value !== undefined && value !== null) {
						if (Array.isArray(value)) {
							formData.append(key, JSON.stringify(value));
						} else {
							formData.append(key, String(value));
						}
					}
				});
			}

			const response = await postCreateGoal(formData);

			if (response.success) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: isRegular ? 'Регулярная цель успешно создана' : 'Цель успешно создана',
				});

				// Если передан обработчик создания цели, вызываем его
				if (onGoalCreated && response.data) {
					onGoalCreated(response.data);
					resetForm();
				} else if (!hideNavigation) {
					// Если не нужно скрывать навигацию, переходим на страницу цели
					navigate(`/goals/${response.data.code}`);
				}
			} else {
				// Упрощаем обработку ошибок, так как теперь бэкенд должен корректно обрабатывать любые названия
				throw new Error(response.error || 'Неизвестная ошибка');
			}
		} catch (error: unknown) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось создать цель',
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Метод для программного создания цели
	const createGoal = async () => {
		if (!title || activeComplexity === null || activeCategory === null || (!image && !imageUrl)) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Заполните все обязательные поля',
			});
			return;
		}

		setIsLoading(true);

		try {
			const formData = new FormData();
			formData.append('title', title);
			if (description) {
				formData.append('description', description);
			}

			if (activeComplexity !== null) {
				formData.append('complexity', selectComplexity[activeComplexity].value);
			}

			// Если выбрана подкатегория, используем её ID
			if (activeSubcategory !== null && subcategories[activeSubcategory]) {
				formData.append('category', subcategories[activeSubcategory].id.toString());
			}
			// Иначе используем ID основной категории
			else if (activeCategory !== null) {
				formData.append('category', parentCategories[activeCategory].id.toString());
			}

			// Если есть локальное изображение, добавляем его в formData
			if (image) {
				formData.append('image', image as Blob);
			}
			// Если есть URL изображения, добавляем его в formData
			else if (imageUrl) {
				formData.append('image_url', imageUrl);
			}

			// Если задан дедлайн, добавляем его в formData
			if (deadline) {
				formData.append('deadline', deadline);
			}

			// Если задано предполагаемое время, добавляем его в formData
			if (estimatedTime) {
				const standardTime = convertTimeToStandardFormat(estimatedTime);
				formData.append('estimated_time', standardTime);
			}

			// Если выбрано место, обрабатываем его
			let locationId = null;
			if (selectedGoalLocation) {
				if (!selectedGoalLocation.id) {
					// Создаем новое место
					try {
						const newLocation = await mapApi.createLocation({
							name: selectedGoalLocation.name! || title,
							longitude: selectedGoalLocation.longitude!,
							latitude: selectedGoalLocation.latitude!,
							country: selectedGoalLocation.country!,
							city: selectedGoalLocation.city,
							description: selectedGoalLocation.description,
							place_type: selectedGoalLocation.place_type || 'other',
						});
						locationId = newLocation.id;
					} catch (error) {
						NotificationStore.addNotification({
							type: 'error',
							title: 'Ошибка',
							message: error instanceof Error ? error.message : 'Не удалось создать место',
						});
						return;
					}
				} else {
					locationId = selectedGoalLocation.id;
				}
			}

			// Если создано место, добавляем его ID
			if (locationId) {
				formData.append('location_id', locationId.toString());
			}

			// Добавляем данные о регулярности, если это регулярная цель
			if (isRegular) {
				formData.append('is_regular', 'true');
				formData.append('regular_frequency', regularFrequency);

				if (regularFrequency === 'weekly') {
					formData.append('weekly_frequency', weeklyFrequency.toString());
				}

				formData.append('duration_type', durationType);

				if (durationType === 'days' || durationType === 'weeks') {
					formData.append('duration_value', durationValue.toString());
				}

				if (durationType === 'until_date' && regularEndDate) {
					formData.append('end_date', regularEndDate);
				}

				formData.append('allow_skip_days', allowSkipDays.toString());
				formData.append('reset_on_skip', resetOnSkip.toString());
			}

			// Добавляем дополнительные поля из внешних API, если они есть
			if (externalGoalFields) {
				Object.entries(externalGoalFields).forEach(([key, value]) => {
					if (value !== undefined && value !== null) {
						if (Array.isArray(value)) {
							formData.append(key, JSON.stringify(value));
						} else {
							formData.append(key, String(value));
						}
					}
				});
			}

			const response = await postCreateGoal(formData);

			if (response.success) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: isRegular ? 'Регулярная цель успешно создана' : 'Цель успешно создана',
				});

				// Если передан обработчик создания цели, вызываем его
				if (onGoalCreated && response.data) {
					onGoalCreated(response.data);
					resetForm();
				} else if (!hideNavigation) {
					// Если не нужно скрывать навигацию, переходим на страницу цели
					navigate(`/goals/${response.data.code}`);
				}
			} else {
				// Упрощаем обработку ошибок, так как теперь бэкенд должен корректно обрабатывать любые названия
				throw new Error(response.error || 'Неизвестная ошибка');
			}
		} catch (error: unknown) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось создать цель',
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Обработчик для добавления цели из внешнего источника
	const handleExternalGoalSelected = (
		goalData: Partial<IGoal> & {imageUrl?: string; external_id?: string | number; externalType?: string}
	) => {
		// Заполняем основные поля
		if (goalData.title) setTitle(goalData.title);
		if (goalData.description) setDescription(goalData.description || '');
		if (goalData.estimatedTime) setEstimatedTime(goalData.estimatedTime);

		// Если у цели есть категория, находим ее индекс
		if (goalData.category) {
			// Определяем, является ли категория подкатегорией
			const goalCategory = categories.find((cat) => cat.id === goalData.category?.id);

			if (goalCategory) {
				if (goalCategory.parentCategory) {
					// Если это подкатегория, находим её родительскую категорию
					const parentCategoryIndex = parentCategories.findIndex((cat) => cat.id === goalCategory.parentCategory?.id);
					if (parentCategoryIndex !== -1) {
						setActiveCategory(parentCategoryIndex);

						// Фильтруем подкатегории из общего списка
						const filteredSubcategories = categories.filter(
							(cat: ICategory) => cat.parentCategory && cat.parentCategory.id === goalCategory.parentCategory?.id
						);
						setSubcategories(filteredSubcategories);

						// Находим индекс подкатегории в отфильтрованном списке
						const subcategoryIndex = filteredSubcategories.findIndex((sub: ICategory) => sub.id === goalCategory.id);
						if (subcategoryIndex !== -1) {
							setActiveSubcategory(subcategoryIndex);
						}
					}
				} else {
					// Если это родительская категория
					const categoryIndex = parentCategories.findIndex((cat) => cat.id === goalCategory.id);
					if (categoryIndex !== -1) {
						setActiveCategory(categoryIndex);

						// Фильтруем подкатегории из общего списка
						const filteredSubcategories = categories.filter(
							(cat: ICategory) => cat.parentCategory && cat.parentCategory.id === goalCategory.id
						);
						setSubcategories(filteredSubcategories);

						// Если у цели есть подкатегория, находим ее индекс
						if (goalData.subcategory && filteredSubcategories) {
							const subcategoryIndex = filteredSubcategories.findIndex(
								(sub: ICategory) => sub.id === goalData.subcategory?.id
							);
							if (subcategoryIndex !== -1) {
								setActiveSubcategory(subcategoryIndex);
							}
						}
					}
				}
			}
		}

		// Сохраняем URL изображения, если он есть
		if (goalData.imageUrl) {
			setImageUrl(goalData.imageUrl);
			setImage(null); // Сбрасываем локально загруженное изображение
		} else if (goalData.image) {
			setImageUrl(goalData.image);
			setImage(null); // Сбрасываем локально загруженное изображение
		}

		// Сохраняем дополнительные поля для передачи на сервер
		console.log('🔧 Debug: goalData.additionalFields:', goalData.additionalFields);
		console.log('🔧 Debug: goalData keys:', Object.keys(goalData));

		const additionalFields = {
			external_id: goalData.external_id,
			type: goalData.externalType,
			// Добавляем поля из additionalFields если они есть
			...(goalData.additionalFields || {}),
			// Извлекаем все дополнительные поля, исключая стандартные поля IGoal
			...Object.fromEntries(
				Object.entries(goalData).filter(
					([key]) =>
						![
							'title',
							'description',
							'estimatedTime',
							'complexity',
							'category',
							'subcategory',
							'imageUrl',
							'image',
							'external_id',
							'externalType',
							'additionalFields', // Исключаем additionalFields, так как мы его уже добавили выше
							'isExistingGoal',
							'status',
							'deadline',
						].includes(key)
				)
			),
		};

		console.log('🔧 Debug: final additionalFields:', additionalFields);
		setExternalGoalFields(additionalFields);

		// Показываем уведомление
		NotificationStore.addNotification({
			type: 'success',
			title: 'Готово',
			message: 'Данные цели загружены! Проверьте и дополните при необходимости.',
		});
	};

	// Содержимое компонента
	const content = (
		<>
			{!hideNavigation && (
				<div className={element('wrapper-title')}>
					<Title tag="h1" className={element('title')}>
						Создание новой цели
					</Title>
					<Button size="small" type="Link" theme="blue" icon="plus" href="/list/create">
						Добавить список целей
					</Button>
				</div>
			)}
			<Loader isLoading={isLoading}>
				<div className={element('content')}>
					{/* Добавляем информационное сообщение */}
					<div className={element('edit-info-message')}>
						<Svg icon="info" className={element('info-icon')} />
						<p>Вы сможете отредактировать или удалить цель в течение 24ч после создания, затем действие будет недоступно</p>
					</div>

					{/* Добавляем компонент поиска внешних целей с учетом выбранной категории/подкатегории */}
					<div className={element('external-search-section')}>
						<ExternalGoalSearch
							onGoalSelected={handleExternalGoalSelected}
							className={element('external-search')}
							category={
								activeSubcategory !== null && subcategories.length > 0
									? subcategories[activeSubcategory].nameEn
									: activeCategory !== null
									? parentCategories[activeCategory].nameEn
									: undefined
							}
						/>
					</div>

					{/* Блок с изображением */}
					<div className={element('image-section')}>
						<p className={element('field-title')}>Изображение цели *</p>
						{!image && !imageUrl ? (
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
								{image && <img src={URL.createObjectURL(image)} alt="Предпросмотр" className={element('preview')} />}
								{imageUrl && !image && (
									<img src={imageUrl} alt="Предпросмотр из источника" className={element('preview')} />
								)}
								<Button
									className={element('remove-image')}
									type="button-close"
									onClick={() => {
										setImage(null);
										setImageUrl(null);
									}}
								/>
							</div>
						)}
					</div>

					<div className={element('form')}>
						<div className={element('field-container')}>
							<FieldInput
								placeholder="Введите название цели"
								id="goal-title"
								text="Название цели *"
								value={title}
								setValue={handleTitleChange}
								className={element('field')}
								required
								onFocus={handleTitleFocus}
								onBlur={handleTitleBlur}
							/>

							{showSimilarGoals && (
								<div className={element('similar-goals')}>
									<div className={element('similar-header')}>
										<h3 className={element('similar-title')}>Похожие цели</h3>
										<button
											type="button"
											className={element('close-similar')}
											onClick={() => setShowSimilarGoals(false)}
											aria-label="Закрыть"
										>
											<Svg icon="cross" />
										</button>
									</div>
									<p className={element('similar-desc')}>
										Найдены похожие цели. Нажмите на цель, чтобы заполнить форму её данными:
									</p>
									<div className={element('similar-list')}>
										{similarGoals.map((goal: IGoal) => (
											<SimilarGoalItem key={goal.id} goal={goal} onSelect={fillFormWithGoalData} />
										))}
									</div>
								</div>
							)}
						</div>

						<Select
							className={element('field')}
							placeholder="Выберите категорию"
							options={parentCategories.map((cat: ICategory) => ({name: cat.name, value: cat.nameEn}))}
							activeOption={activeCategory}
							onSelect={setActiveCategory}
							text="Категория *"
							disabled={lockCategory}
						/>

						{activeCategory !== null && subcategories.length > 0 && (
							<Select
								className={element('field')}
								placeholder="Выберите подкатегорию (необязательно)"
								options={subcategories.map((sub) => ({name: sub.name, value: sub.nameEn}))}
								activeOption={activeSubcategory}
								onSelect={setActiveSubcategory}
								text="Подкатегория"
								disabled={lockCategory}
							/>
						)}

						{/* Новое поле для места с картой */}
						{activeCategory !== null && parentCategories[activeCategory].nameEn === 'travel' && (
							<div className={element('location-field-container')}>
								<p className={element('field-title')}>Место на карте</p>

								{selectedGoalLocation ? (
									<div className={element('selected-location')}>
										<div className={element('selected-location-info')}>
											<Svg icon="map" className={element('location-icon')} />
											<div>
												<div className={element('selected-location-name')}>{selectedGoalLocation?.name}</div>
												<div className={element('selected-location-details')}>
													{selectedGoalLocation?.city && `${selectedGoalLocation.city}, `}
													{selectedGoalLocation?.country}
												</div>
												{selectedGoalLocation?.description && (
													<div className={element('selected-location-description')}>
														{selectedGoalLocation.description}
													</div>
												)}
											</div>
										</div>
										<div className={element('location-actions')}>
											<Button theme="blue-light" size="small" onClick={openLocationPicker}>
												Изменить место
											</Button>
											<Button theme="red" size="small" onClick={clearSelectedLocation}>
												Удалить место
											</Button>
										</div>
									</div>
								) : (
									<div className={element('location-empty')}>
										<p>Выберите географическое место на карте</p>
										<Button theme="blue" onClick={openLocationPicker}>
											Выбрать место на карте
										</Button>
									</div>
								)}

								<small className={element('format-hint')}>
									Выберите географическое место на карте. Это поможет отслеживать ваши путешествия на карте.
								</small>
							</div>
						)}

						<Select
							className={element('field')}
							placeholder="Выберите сложность"
							options={selectComplexity}
							activeOption={activeComplexity}
							onSelect={setActiveComplexity}
							text="Сложность *"
						/>

						{/* Секция регулярности выполнения */}
						<div className={element('regular-section')}>
							<FieldCheckbox
								id="is-regular"
								text="Это регулярная цель"
								checked={isRegular}
								setChecked={setIsRegular}
								className={element('field')}
							/>

							{isRegular && (
								<div className={element('regular-config')}>
									<div className={element('regular-field-group')}>
										<Select
											className={element('field')}
											placeholder="Выберите периодичность"
											options={[
												{name: 'Ежедневно', value: 'daily'},
												{name: 'N раз в неделю', value: 'weekly'},
												{name: 'Пользовательский график', value: 'custom'},
											]}
											activeOption={regularFrequency === 'daily' ? 0 : regularFrequency === 'weekly' ? 1 : 2}
											onSelect={(index) => {
												const frequencies = ['daily', 'weekly', 'custom'] as const;
												setRegularFrequency(frequencies[index]);
											}}
											text="Периодичность"
										/>

										{regularFrequency === 'weekly' && (
											<FieldInput
												placeholder="Например: 3"
												id="weekly-frequency"
												text="Сколько раз в неделю"
												value={weeklyFrequency.toString()}
												setValue={(value) => {
													const num = parseInt(value, 10) || 1;
													setWeeklyFrequency(Math.min(7, Math.max(1, num)));
												}}
												className={element('field')}
												type="number"
											/>
										)}

										{regularFrequency === 'custom' && (
											<div className={element('custom-schedule-info')}>
												<p>Пользовательский график будет доступен в следующих версиях</p>
											</div>
										)}
									</div>

									<div className={element('regular-field-group')}>
										<Select
											className={element('field')}
											placeholder="Выберите тип длительности"
											options={[
												{name: 'Дни', value: 'days'},
												{name: 'Недели', value: 'weeks'},
												{name: 'До даты', value: 'until_date'},
												{name: 'Бессрочно', value: 'indefinite'},
											]}
											activeOption={
												durationType === 'days'
													? 0
													: durationType === 'weeks'
													? 1
													: durationType === 'until_date'
													? 2
													: 3
											}
											onSelect={(index) => {
												const types = ['days', 'weeks', 'until_date', 'indefinite'] as const;
												setDurationType(types[index]);
											}}
											text="Длительность"
										/>

										{(durationType === 'days' || durationType === 'weeks') && (
											<FieldInput
												placeholder={durationType === 'days' ? 'Количество дней' : 'Количество недель'}
												id="duration-value"
												text={durationType === 'days' ? 'Количество дней' : 'Количество недель'}
												value={durationValue.toString()}
												setValue={(value) => {
													const num = parseInt(value, 10) || 1;
													setDurationValue(Math.max(1, num));
												}}
												className={element('field')}
												type="number"
											/>
										)}

										{durationType === 'until_date' && (
											<div className={element('date-field-container')}>
												<p className={element('field-title')}>Дата окончания</p>
												<DatePicker
													selected={regularEndDate ? new Date(regularEndDate) : null}
													onChange={(date) => {
														if (date) {
															setRegularEndDate(format(date, 'yyyy-MM-dd'));
														} else {
															setRegularEndDate('');
														}
													}}
													className={element('date-input')}
													placeholderText="ДД.ММ.ГГГГ"
													minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
												/>
											</div>
										)}
									</div>

									<div className={element('regular-field-group')}>
										<FieldInput
											placeholder="0"
											id="allow-skip-days"
											text="Разрешенные пропуски"
											value={allowSkipDays.toString()}
											setValue={(value) => {
												const num = parseInt(value, 10) || 0;
												setAllowSkipDays(Math.max(0, num));
											}}
											className={element('field')}
											type="number"
										/>

										<FieldCheckbox
											id="reset-on-skip"
											text="Сбрасывать прогресс при превышении лимита пропусков"
											checked={resetOnSkip}
											setChecked={setResetOnSkip}
											className={element('field')}
										/>
									</div>
								</div>
							)}
						</div>

						<FieldInput
							placeholder="Опишите цель подробно"
							id="goal-description"
							text="Описание"
							value={description}
							setValue={setDescription}
							className={element('field')}
							type="textarea"
						/>

						<div className={element('time-field-container')}>
							<FieldInput
								placeholder="Например: 5, 2:30, 3д5ч, 3д 5 ч, 3 дня, 5 часов"
								id="goal-estimated-time"
								text="Предполагаемое время выполнения"
								value={estimatedTime}
								setValue={handleEstimatedTimeChange}
								className={element('field')}
								type="text"
							/>
							<small className={element('format-hint')}>
								Укажите время: просто число (часы), ЧЧ:ММ (02:30), комбинации (3д5ч, 3д 5ч), или словами (3 дня, 5 часов, 30
								минут)
							</small>
						</div>

						<div className={element('date-field-container')}>
							<p className={element('field-title')}>Планируемая дата реализации</p>
							<DatePicker
								selected={deadline ? new Date(deadline) : null}
								onChange={(date) => {
									if (date) {
										// Форматируем дату в строку в формате YYYY-MM-DD
										setDeadline(format(date, 'yyyy-MM-dd'));
									} else {
										setDeadline('');
									}
								}}
								className={element('date-input')}
								placeholderText="ДД.ММ.ГГГГ"
								minDate={new Date(new Date().setDate(new Date().getDate() + 1))} // завтра
							/>
							<small id="date-format-hint" className={element('format-hint')}>
								Укажите планируемую дату достижения цели (не ранее завтрашнего дня)
							</small>
						</div>

						<div className={element('btns-wrapper')}>
							{!hideNavigation && (
								<Button theme="blue-light" className={element('btn')} onClick={() => navigate(-1)} type="button">
									Отмена
								</Button>
							)}
							<Button
								theme="blue"
								className={element('btn')}
								typeBtn="submit"
								onClick={
									noForm
										? (e) => {
												e.preventDefault();
												createGoal();
										  }
										: undefined
								}
							>
								Создать цель (+15 опыта)
							</Button>
						</div>
					</div>
				</div>
			</Loader>
		</>
	);

	// Возвращаем содержимое с оберткой form или без нее
	return noForm ? (
		<div className={block()}>{content}</div>
	) : (
		<form className={block()} onSubmit={onSubmit}>
			{content}
		</form>
	);
};
