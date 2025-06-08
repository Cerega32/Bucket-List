import {format} from 'date-fns';
import {FC, useCallback, useEffect, useRef, useState} from 'react';
import {FileDrop} from 'react-file-drop';

import {Button} from '@/components/Button/Button';
import {DatePicker} from '@/components/DatePicker/DatePicker';
import {ExternalGoalSearch} from '@/components/ExternalGoalSearch/ExternalGoalSearch';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {ICategory, IGoal} from '@/typings/goal';
import {getSimilarGoals} from '@/utils/api/get/getSimilarGoals';
import {debounce} from '@/utils/time/debounce';
import {selectComplexity} from '@/utils/values/complexity';

import {Loader} from '../Loader/Loader';
import Select from '../Select/Select';
import {SimilarGoalItem} from '../SimilarGoalItem/SimilarGoalItem';

import './add-goal.scss';

interface EditGoalFromListProps {
	className?: string;
	goal: any; // Исходная цель для редактирования
	onGoalEdited: (editedGoal: any) => void; // Callback при сохранении изменений
	onCancel: () => void; // Callback при отмене
	initialCategory?: ICategory;
	preloadedCategories?: ICategory[];
	preloadedSubcategories?: ICategory[];
	autoParserData?: any; // Данные из автопарсера
}

export const EditGoalFromList: FC<EditGoalFromListProps> = (props) => {
	const {
		className,
		goal,
		onGoalEdited,
		onCancel,
		initialCategory,
		preloadedCategories = [],
		preloadedSubcategories = [],
		autoParserData,
	} = props;

	const [block, element] = useBem('add-goal', className);

	// Инициализируем состояние один раз при монтировании
	const [initialized, setInitialized] = useState(false);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [activeComplexity, setActiveComplexity] = useState<number | null>(null);
	const [activeCategory, setActiveCategory] = useState<number | null>(null);
	const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);
	const [deadline, setDeadline] = useState<string>('');
	const [estimatedTime, setEstimatedTime] = useState<string>('');
	const [image, setImage] = useState<File | null>(null);
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [categories] = useState<ICategory[]>(preloadedCategories);
	const [subcategories] = useState<ICategory[]>(preloadedSubcategories);
	const [isLoading, setIsLoading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	// Состояние для хранения дополнительных полей из внешних API
	const [externalGoalFields, setExternalGoalFields] = useState<any>(autoParserData || {});
	// Новые состояния для поиска похожих целей
	const [similarGoals, setSimilarGoals] = useState<IGoal[]>([]);
	const [, setIsSearching] = useState(false);
	const [showSimilarGoals, setShowSimilarGoals] = useState(false);
	const [isTitleFocused, setIsTitleFocused] = useState(false);

	useEffect(() => {
		if (autoParserData) {
			setExternalGoalFields(autoParserData);
		}
	}, [autoParserData]);

	// Инициализация начальных данных - только один раз при монтировании
	useEffect(() => {
		if (!initialized && goal && categories.length > 0) {
			// Инициализируем базовые поля
			setTitle(goal.title || '');
			setDescription(goal.description || '');
			setDeadline(goal.deadline || '');
			setEstimatedTime(goal.estimatedTime || '');
			setImageUrl(goal.image || null);

			// Определяем индекс сложности
			if (goal.complexity) {
				const complexityIndex = selectComplexity.findIndex((item) => item.value === goal.complexity);
				if (complexityIndex !== -1) {
					setActiveComplexity(complexityIndex);
				}
			}

			// Инициализируем категорию
			if (initialCategory) {
				// Если передана подкатегория, ищем её родительскую категорию
				if (initialCategory.parentCategory) {
					const parentIndex = categories.findIndex((cat) => cat.id === initialCategory.parentCategory?.id);
					if (parentIndex !== -1) {
						setActiveCategory(parentIndex);
						// Ищем индекс подкатегории
						const subcategoryIndex = subcategories.findIndex((sub) => sub.id === initialCategory.id);
						if (subcategoryIndex !== -1) {
							setActiveSubcategory(subcategoryIndex);
						}
					}
				} else {
					// Если передана основная категория
					const categoryIndex = categories.findIndex((cat) => cat.id === initialCategory.id);
					if (categoryIndex !== -1) {
						setActiveCategory(categoryIndex);
					}
				}
			} else if (goal.category) {
				// Если нет initialCategory, используем категорию из goal
				const categoryIndex = categories.findIndex((cat) => cat.id === goal.category.id);
				if (categoryIndex !== -1) {
					setActiveCategory(categoryIndex);
				}
			}

			setInitialized(true);
		}
	}, [goal, categories, subcategories, initialCategory, initialized]);

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

	// Функция для поиска похожих целей с дебаунсом
	const debouncedSearch = useCallback(
		debounce(async (query: string) => {
			if (query.length < 3) {
				setSimilarGoals([]);
				setIsSearching(false);
				setShowSimilarGoals(false);
				return;
			}

			try {
				const response = await getSimilarGoals(query);
				if (response.success && response?.data?.results) {
					setSimilarGoals(response.data.results);
					setShowSimilarGoals(response.data.results.length > 0 && isTitleFocused);
				}
			} catch (error) {
				console.error('Ошибка при поиске похожих целей:', error);
			} finally {
				setIsSearching(false);
			}
		}, 500),
		[isTitleFocused]
	);

	// Вызов поиска при изменении названия цели
	useEffect(() => {
		if (title) {
			setIsSearching(true);
			debouncedSearch(title);
		} else {
			setSimilarGoals([]);
			setShowSimilarGoals(false);
		}
	}, [title, debouncedSearch]);

	// Обработчики фокуса для поля ввода названия
	const handleTitleFocus = () => {
		setIsTitleFocused(true);
		if (similarGoals.length > 0) {
			setShowSimilarGoals(true);
		}
	};

	const handleTitleBlur = () => {
		// Используем setTimeout, чтобы дать время для клика по элементу списка
		setTimeout(() => {
			setIsTitleFocused(false);
			setShowSimilarGoals(false);
		}, 200);
	};

	// Функция для заполнения полей формы данными из выбранной цели
	const fillFormWithGoalData = (selectedGoal: IGoal) => {
		setTitle(selectedGoal.title);
		setDescription(selectedGoal.description);
		setEstimatedTime(selectedGoal.estimatedTime || '');

		// Находим индекс сложности в массиве selectComplexity
		const complexityIndex = selectComplexity.findIndex((item) => item.value === selectedGoal.complexity);
		if (complexityIndex !== -1) {
			setActiveComplexity(complexityIndex);
		}

		// Находим индекс категории в массиве categories
		const categoryIndex = categories.findIndex((cat) => cat.id === selectedGoal.category.id);
		if (categoryIndex !== -1) {
			setActiveCategory(categoryIndex);

			// Если у цели есть подкатегория, находим ее индекс
			if (selectedGoal.subcategory && subcategories.length > 0) {
				const subcategoryIndex = subcategories.findIndex((sub) => sub.id === selectedGoal.subcategory?.id);
				if (subcategoryIndex !== -1) {
					setActiveSubcategory(subcategoryIndex);
				}
			}
		}

		// Скрываем список похожих целей после выбора
		setShowSimilarGoals(false);
		setIsTitleFocused(false);

		// Показываем уведомление
		NotificationStore.addNotification({
			type: 'warning',
			title: 'Данные заполнены',
			message: 'Поля формы заполнены данными выбранной цели. Вы можете изменить их перед сохранением.',
		});
	};

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

	// Обработчик для добавления цели из внешнего источника
	const handleExternalGoalSelected = (
		goalData: Partial<IGoal> & {imageUrl?: string; external_id?: string | number; externalType?: string}
	) => {
		console.log('[LOG] goalData', goalData);
		// Заполняем форму данными из внешней цели
		setTitle(goalData.title || '');
		setDescription(goalData.description || '');

		// Находим индекс сложности в массиве selectComplexity
		if (goalData.complexity) {
			const complexityIndex = selectComplexity.findIndex((item) => item.value === goalData.complexity);
			if (complexityIndex !== -1) {
				setActiveComplexity(complexityIndex);
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
		const additionalFields = {
			external_id: goalData.external_id,
			type: goalData.externalType,
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
						].includes(key)
				)
			),
		};
		console.log('[!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!LOG] additionalFields', additionalFields);
		setExternalGoalFields({
			...externalGoalFields,
			additionalFields: {...additionalFields},
			// Обновляем статус на external
			status: 'external',
			apiSource: goalData.externalType,
		});

		// Показываем уведомление
		NotificationStore.addNotification({
			type: 'success',
			title: 'Готово',
			message: 'Данные цели загружены! Проверьте и дополните при необходимости.',
		});
	};

	// Изменяем сигнатуру onSubmit
	const onSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
		if (e && typeof e.preventDefault === 'function') e.preventDefault();

		if (!title || !description || activeComplexity === null || activeCategory === null || (!image && !imageUrl)) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Заполните все обязательные поля',
			});
			return;
		}

		setIsLoading(true);

		try {
			// Подготавливаем данные для сохранения
			const editedGoal = {
				title,
				description,
				complexity: selectComplexity[activeComplexity].value,
				category: activeSubcategory !== null ? subcategories[activeSubcategory] : categories[activeCategory],
				estimatedTime: estimatedTime ? convertTimeToStandardFormat(estimatedTime) : '',
				deadline,
				shortDescription: description ? `${description.substring(0, 100)}...` : goal.shortDescription,
				// Если есть файл изображения, сохраняем его для последующей обработки
				imageFile: image,
				// Если есть URL изображения, сохраняем его
				image: image ? null : imageUrl,
				// Обновляем autoParserData с новыми данными
				autoParserData: {
					...goal.autoParserData,
					...externalGoalFields,
					// Перезаписываем основными полями
					title,
					description,
					imageUrl: image ? null : imageUrl,
					estimatedTime: estimatedTime ? convertTimeToStandardFormat(estimatedTime) : '',
				},
			};
			console.log('[!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!LOG] editedGoal', editedGoal);
			// Вызываем callback с отредактированной целью
			onGoalEdited(editedGoal);

			NotificationStore.addNotification({
				type: 'success',
				title: 'Успех',
				message: 'Цель успешно отредактирована',
			});

			// Автоматически закрываем окно редактирования
			onCancel();
		} catch (error: unknown) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось отредактировать цель',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className={block()}>
			<Loader isLoading={isLoading}>
				<div className={element('content')}>
					{/* Добавляем компонент поиска внешних целей с учетом выбранной категории/подкатегории */}
					<div className={element('external-search-section')}>
						<ExternalGoalSearch
							onGoalSelected={handleExternalGoalSelected}
							className={element('external-search')}
							category={
								activeSubcategory !== null && subcategories.length > 0
									? subcategories[activeSubcategory].nameEn
									: activeCategory !== null
									? categories[activeCategory].nameEn
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
										{similarGoals.map((similarGoal) => (
											<SimilarGoalItem key={similarGoal.id} goal={similarGoal} onSelect={fillFormWithGoalData} />
										))}
									</div>
								</div>
							)}
						</div>

						<Select
							className={element('field')}
							placeholder="Выберите сложность"
							options={selectComplexity}
							activeOption={activeComplexity}
							onSelect={setActiveComplexity}
							text="Сложность *"
						/>

						<FieldInput
							placeholder="Опишите цель подробно"
							id="goal-description"
							text="Описание *"
							value={description}
							setValue={setDescription}
							className={element('field')}
							type="textarea"
							required
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
							<Button theme="blue-light" className={element('btn')} onClick={onCancel} type="button">
								Отмена
							</Button>
							<Button theme="blue" className={element('btn')} onClick={onSubmit} type="button">
								Сохранить изменения
							</Button>
						</div>
					</div>
				</div>
			</Loader>
		</div>
	);
};
