import {format} from 'date-fns';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {FileDrop} from 'react-file-drop';

import {Button} from '@/components/Button/Button';
import {DatePicker} from '@/components/DatePicker/DatePicker';
import {ExternalGoalSearch} from '@/components/ExternalGoalSearch/ExternalGoalSearch';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {ICategory, IGoal, ILocation} from '@/typings/goal';
import {getCategories} from '@/utils/api/get/getCategories';
import {getCategory} from '@/utils/api/get/getCategory';
import {getSimilarGoals} from '@/utils/api/get/getSimilarGoals';
import {debounce} from '@/utils/time/debounce';
import {selectComplexity} from '@/utils/values/complexity';

import Select from '../Select/Select';
import {SimilarGoalItem} from '../SimilarGoalItem/SimilarGoalItem';

interface GoalEditFormProps {
	initialGoal?: Partial<IGoal>;
	onSave: (
		goal: Partial<IGoal> & {
			imageUrl?: string;
			image?: File | null;
			external_id?: string | number;
			externalType?: string;
			location?: Partial<ILocation> | null;
		}
	) => void;
	onCancel: () => void;
	mode?: 'edit' | 'create';
	className?: string;
	lockCategory?: boolean;
	noForm?: boolean;
	initialCategory?: ICategory;
	preloadedCategories?: ICategory[];
	preloadedSubcategories?: ICategory[];
}

export const GoalEditForm: React.FC<GoalEditFormProps> = ({
	initialGoal = {},
	onSave,
	onCancel,
	mode = 'edit',
	className,
	lockCategory = false,
	noForm = false,
	initialCategory,
	preloadedCategories,
	preloadedSubcategories,
}) => {
	const [block, element] = useBem('goal-edit-form', className);

	// Состояния формы
	const [title, setTitle] = useState(initialGoal.title || '');
	const [description, setDescription] = useState(initialGoal.description || '');
	const [activeComplexity, setActiveComplexity] = useState<number | null>(
		initialGoal.complexity ? selectComplexity.findIndex((c) => c.value === initialGoal.complexity) : 1
	);
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [subcategories, setSubcategories] = useState<ICategory[]>([]);
	const [activeCategory, setActiveCategory] = useState<number | null>(null);
	const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);
	const [deadline, setDeadline] = useState<string>((initialGoal as any).deadline || '');
	const [estimatedTime, setEstimatedTime] = useState((initialGoal as any).estimatedTime || '');
	const [image, setImage] = useState<File | null>(null);
	const [imageUrl, setImageUrl] = useState<string | null>((initialGoal as any).imageUrl || (initialGoal as any).image || null);
	const [selectedGoalLocation, setSelectedGoalLocation] = useState<Partial<ILocation> | null>((initialGoal as any).location || null);
	const [externalGoalFields, setExternalGoalFields] = useState<any>(null);
	const [similarGoals, setSimilarGoals] = useState<IGoal[]>([]);
	const [showSimilarGoals, setShowSimilarGoals] = useState(false);
	const [isTitleFocused, setIsTitleFocused] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	// Загрузка категорий при монтировании компонента
	useEffect(() => {
		const loadCategories = async () => {
			try {
				// Если переданы готовые категории, используем их
				if (preloadedCategories) {
					setCategories(preloadedCategories);
				} else {
					// Иначе загружаем категории с сервера
					const data = await getCategories();
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

	// Фильтрация подкатегорий при изменении категории
	useEffect(() => {
		if (activeCategory !== null) {
			const loadSubcategories = async () => {
				// Если переданы готовые подкатегории, используем их
				if (preloadedSubcategories) {
					setSubcategories(preloadedSubcategories);
				} else {
					// Иначе загружаем подкатегории с сервера
					const data = await getCategory(categories[activeCategory].nameEn);
					if (data.success) {
						setSubcategories(data.data.subcategories);
					}
				}
				// Сбрасываем подкатегорию только если не устанавливается initialCategory
				if (!initialCategory || !initialCategory.parentCategory) {
					setActiveSubcategory(null);
				}
			};
			loadSubcategories();
		}
	}, [activeCategory, categories, initialCategory, preloadedSubcategories]);

	// Добавляем эффект для установки начальной категории из props
	useEffect(() => {
		if (initialCategory && categories.length > 0) {
			// Если передана подкатегория, ищем её родительскую категорию
			if (initialCategory.parentCategory) {
				const parentIndex = categories.findIndex((cat) => cat.id === initialCategory.parentCategory?.id);

				if (parentIndex !== -1) {
					setActiveCategory(parentIndex);

					// Загружаем подкатегории для родительской категории
					const loadSubcategoriesAndSetSubcategory = async () => {
						try {
							let subcategoriesData;

							// Если переданы готовые подкатегории, используем их
							if (preloadedSubcategories) {
								subcategoriesData = preloadedSubcategories;
								setSubcategories(preloadedSubcategories);
							} else {
								// Иначе загружаем подкатегории с сервера
								const data = await getCategory(categories[parentIndex].nameEn);
								if (data.success) {
									subcategoriesData = data.data.subcategories;
									setSubcategories(data.data.subcategories);
								}
							}

							if (subcategoriesData) {
								// Ищем индекс подкатегории
								const subcategoryIndex = subcategoriesData.findIndex((sub: ICategory) => sub.id === initialCategory.id);

								if (subcategoryIndex !== -1) {
									// Добавляем небольшую задержку для обеспечения корректной установки
									setTimeout(() => {
										setActiveSubcategory(subcategoryIndex);
									}, 100);
								}
							}
						} catch (error) {
							console.error('Ошибка при загрузке подкатегорий для initialCategory:', error);
						}
					};

					loadSubcategoriesAndSetSubcategory();
				}
			} else {
				// Если передана основная категория
				const categoryIndex = categories.findIndex((cat) => cat.id === initialCategory.id);

				if (categoryIndex !== -1) {
					setActiveCategory(categoryIndex);
				}
			}
		}
	}, [initialCategory, categories, preloadedSubcategories]);

	// Поиск похожих целей
	const debouncedSearch = useCallback(
		debounce(async (query: string) => {
			if (query.length < 3) {
				setSimilarGoals([]);
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
				setSimilarGoals([]);
			}
		}, 500),
		[isTitleFocused]
	);

	useEffect(() => {
		if (title) {
			debouncedSearch(title);
		} else {
			setSimilarGoals([]);
			setShowSimilarGoals(false);
		}
	}, [title, debouncedSearch]);

	// Обработчики фокуса для поля ввода названия
	const handleTitleFocus = () => {
		setIsTitleFocused(true);
		if (similarGoals.length > 0) setShowSimilarGoals(true);
	};
	const handleTitleBlur = () => {
		setTimeout(() => {
			setIsTitleFocused(false);
			setShowSimilarGoals(false);
		}, 200);
	};

	// Обработчик выбора похожей цели
	const fillFormWithGoalData = (goal: IGoal) => {
		setTitle(goal.title);
		setDescription(goal.description);
		setEstimatedTime(goal.estimatedTime || '');
		const complexityIndex = selectComplexity.findIndex((item) => item.value === goal.complexity);
		if (complexityIndex !== -1) setActiveComplexity(complexityIndex);
		const categoryIndex = categories.findIndex((cat) => cat.id === goal.category.id);
		if (categoryIndex !== -1) setActiveCategory(categoryIndex);
		if (goal.subcategory && subcategories && subcategories.length > 0) {
			const subcategoryIndex = subcategories.findIndex((sub) => sub.id === goal.subcategory?.id);
			if (subcategoryIndex !== -1) setActiveSubcategory(subcategoryIndex);
		}
		setShowSimilarGoals(false);
		setIsTitleFocused(false);
		NotificationStore.addNotification({
			type: 'warning',
			title: 'Данные заполнены',
			message: 'Поля формы заполнены данными выбранной цели. Вы можете изменить их перед сохранением.',
		});
	};

	// Обработчик выбора места
	const openLocationPicker = () => {
		// TODO: реализовать через ModalStore, если нужно
		NotificationStore.addNotification({type: 'warning', title: 'Место', message: 'Выбор места реализуется через карту.'});
	};
	const clearSelectedLocation = () => setSelectedGoalLocation(null);

	// Обработчик загрузки изображения
	const onDrop = useCallback((acceptedFiles: FileList) => {
		if (acceptedFiles && acceptedFiles.length > 0) {
			setImage(acceptedFiles[0]);
			setImageUrl(null);
		}
	}, []);
	const handleFileInputClick = () => fileInputRef.current?.click();
	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) onDrop(event.target.files);
	};

	// Обработчик выбора цели из внешнего API
	const handleExternalGoalSelected = (
		goalData: Partial<IGoal> & {imageUrl?: string; external_id?: string | number; externalType?: string}
	) => {
		setTitle(goalData.title || '');
		setDescription(goalData.description || '');
		setEstimatedTime(goalData.estimatedTime || '');
		if (goalData.complexity) {
			const complexityIndex = selectComplexity.findIndex((item) => item.value === goalData.complexity);
			if (complexityIndex !== -1) setActiveComplexity(complexityIndex);
		}
		if (goalData.category) {
			const categoryIndex = categories.findIndex((cat) => cat.id === goalData.category?.id);
			if (categoryIndex !== -1) setActiveCategory(categoryIndex);
		}
		if (goalData.imageUrl) {
			setImageUrl(goalData.imageUrl);
			setImage(null);
		} else if (goalData.image) {
			setImageUrl(goalData.image);
			setImage(null);
		}
		setExternalGoalFields({external_id: goalData.external_id, type: goalData.externalType});
		NotificationStore.addNotification({
			type: 'success',
			title: 'Готово',
			message: 'Данные цели загружены! Проверьте и дополните при необходимости.',
		});
	};

	// Обработчик изменения времени
	const handleEstimatedTimeChange = (value: string) => {
		const cleanValue = value.replace(/[^0-9:дчмдней ыячасовминут\s]/gi, '');
		setEstimatedTime(cleanValue);
	};

	// Преобразование времени в HH:MM
	const convertTimeToStandardFormat = (timeString: string): string => {
		if (!timeString) return '';
		const timePattern = /^(\d{1,2}):(\d{1,2})$/;
		if (timePattern.test(timeString)) {
			const match = timeString.match(timePattern);
			if (match) {
				const hours = match[1].padStart(2, '0');
				const minutes = match[2].padStart(2, '0');
				return `${hours}:${minutes}`;
			}
		}
		const simpleNumberPattern = /^\d+$/;
		if (simpleNumberPattern.test(timeString)) {
			const hours = parseInt(timeString, 10);
			return `${hours.toString().padStart(2, '0')}:00`;
		}
		return timeString;
	};

	// Сохранение
	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		if (!title || !description || activeComplexity === null || activeCategory === null || (!image && !imageUrl)) {
			NotificationStore.addNotification({type: 'error', title: 'Ошибка', message: 'Заполните все обязательные поля'});
			return;
		}
		onSave({
			title,
			description,
			complexity: selectComplexity[activeComplexity].value,
			category: categories[activeCategory],
			subcategory: activeSubcategory !== null && subcategories ? subcategories[activeSubcategory] : undefined,
			deadline,
			estimatedTime: convertTimeToStandardFormat(estimatedTime),
			image,
			imageUrl,
			location: selectedGoalLocation,
			...externalGoalFields,
		});
	};

	// Определяем поддерживаемую категорию для external API
	const supportedCategories = ['books', 'cinema-art', 'gaming'];
	const externalCategory =
		activeSubcategory !== null && subcategories && subcategories.length > 0
			? subcategories[activeSubcategory].nameEn
			: activeCategory !== null && categories.length > 0
			? categories[activeCategory].nameEn
			: undefined;
	const showExternalSearch = externalCategory && supportedCategories.includes(externalCategory);

	const content = (
		<>
			<div className={element('fields')}>
				{showExternalSearch && (
					<div className={element('external-search-section')}>
						<ExternalGoalSearch
							onGoalSelected={handleExternalGoalSelected}
							className={element('external-search')}
							category={externalCategory}
						/>
					</div>
				)}
				<FieldInput
					placeholder="Введите название цели"
					id="goal-title"
					text="Название цели *"
					value={title}
					setValue={setTitle}
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
						<p className={element('similar-desc')}>Найдены похожие цели. Нажмите на цель, чтобы заполнить форму её данными:</p>
						<div className={element('similar-list')}>
							{similarGoals.map((goal) => (
								<SimilarGoalItem key={goal.id} goal={goal} onSelect={fillFormWithGoalData} />
							))}
						</div>
					</div>
				)}
				<Select
					className={element('field')}
					placeholder="Выберите категорию"
					options={categories.map((cat) => ({name: cat.name, value: cat.nameEn}))}
					activeOption={activeCategory}
					onSelect={setActiveCategory}
					text="Категория *"
					disabled={lockCategory}
				/>
				{activeCategory !== null && subcategories && subcategories.length > 0 && (
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
				{activeCategory !== null && categories[activeCategory]?.nameEn === 'travel' && (
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
						Укажите время: просто число (часы), ЧЧ:ММ (02:30), комбинации (3д5ч, 3д 5ч), или словами (3 дня, 5 часов, 30 минут)
					</small>
				</div>
				<div className={element('date-field-container')}>
					<p className={element('field-title')}>Планируемая дата реализации</p>
					<DatePicker
						selected={deadline ? new Date(deadline) : null}
						onChange={(date) => {
							if (date) setDeadline(format(date, 'yyyy-MM-dd'));
							else setDeadline('');
						}}
						className={element('date-input')}
						placeholderText="ДД.ММ.ГГГГ"
						minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
					/>
					<small id="date-format-hint" className={element('format-hint')}>
						Укажите планируемую дату достижения цели (не ранее завтрашнего дня)
					</small>
				</div>
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
										if (e.key === 'Enter' || e.key === ' ') handleFileInputClick();
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
							{imageUrl && !image && <img src={imageUrl} alt="Предпросмотр из источника" className={element('preview')} />}
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
			</div>
			<div className={element('actions')}>
				<Button theme="blue" className={element('btn')} typeBtn="submit">
					{mode === 'edit' ? 'Сохранить' : 'Создать цель'}
				</Button>
				<Button theme="blue-light" className={element('btn')} type="button" onClick={onCancel}>
					Отмена
				</Button>
			</div>
		</>
	);

	if (noForm) {
		return <div className={block()}>{content}</div>;
	}
	return (
		<form className={block()} onSubmit={handleSave}>
			{content}
		</form>
	);
};
