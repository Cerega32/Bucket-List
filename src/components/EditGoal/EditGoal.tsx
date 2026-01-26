import {format} from 'date-fns';
import {FC, FormEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FileDrop} from 'react-file-drop';
import {useNavigate} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {DatePicker} from '@/components/DatePicker/DatePicker';
import {FieldCheckbox} from '@/components/FieldCheckbox/FieldCheckbox';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {ThemeStore} from '@/store/ThemeStore';
import {ICategory, IGoal} from '@/typings/goal';
import {deleteGoal} from '@/utils/api/delete/deleteGoal';
import {getAllCategories} from '@/utils/api/get/getCategories';
import {updateGoal} from '@/utils/api/put/updateGoal';
import {validateTimeInput} from '@/utils/time/formatEstimatedTime';
import {selectComplexity} from '@/utils/values/complexity';
import {GOAL_TITLE_MAX_LENGTH} from '@/utils/values/goalConstants';

import {AllowCustomSettingsField} from '../AddGoal/components/AllowCustomSettingsField';
import {Loader} from '../Loader/Loader';
import {ModalConfirm} from '../ModalConfirm/ModalConfirm';
import Select from '../Select/Select';
import {Title} from '../Title/Title';
import {WeekDaySchedule, WeekDaySelector} from '../WeekDaySelector/WeekDaySelector';

import '../AddGoal/add-goal.scss';

interface EditGoalProps {
	goal: IGoal;
	className?: string;
	onGoalUpdated?: (goal: IGoal) => void;
	cancelEdit?: () => void;
}

export const EditGoal: FC<EditGoalProps> = (props) => {
	const {goal, className, onGoalUpdated, cancelEdit} = props;
	const navigate = useNavigate();

	const [block, element] = useBem('add-goal', className); // Используем те же стили, что и для добавления
	const [title, setTitle] = useState(goal.title ? goal.title.slice(0, GOAL_TITLE_MAX_LENGTH) : '');
	const [description, setDescription] = useState(goal.description || '');
	const [estimatedTime, setEstimatedTime] = useState(goal.estimatedTime || '');
	const [activeComplexity, setActiveComplexity] = useState<number | null>(null);
	const [activeCategory, setActiveCategory] = useState<number | null>(null);
	const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);
	const [image, setImage] = useState<File | null>(null);
	const [imageUrl, setImageUrl] = useState<string | null>(goal.image || null);
	const [categories, setCategories] = useState<ICategory[]>([]);
	const [subcategories, setSubcategories] = useState<ICategory[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [canEdit, setCanEdit] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const {setHeader} = ThemeStore;
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [customSchedule, setCustomSchedule] = useState<WeekDaySchedule>({
		monday: false,
		tuesday: false,
		wednesday: false,
		thursday: false,
		friday: false,
		saturday: false,
		sunday: false,
	});

	// Состояния для регулярности
	const [isRegular, setIsRegular] = useState(false);
	const [allowCustomSettings, setAllowCustomSettings] = useState(true);
	const [regularFrequency, setRegularFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
	const [weeklyFrequency, setWeeklyFrequency] = useState(3);
	const [durationType, setDurationType] = useState<'days' | 'weeks' | 'until_date' | 'indefinite'>('days');
	const [durationValue, setDurationValue] = useState(30);
	const [regularEndDate, setRegularEndDate] = useState('');
	const [allowSkipDays, setAllowSkipDays] = useState(0);
	const [resetOnSkip, setResetOnSkip] = useState(false);

	// Получаем только родительские категории для основного dropdown используя useMemo для оптимизации
	const parentCategories = useMemo(() => categories.filter((cat) => !cat.parentCategory), [categories]);

	// Загрузка категорий и проверка возможности редактирования при монтировании компонента
	useEffect(() => {
		setHeader('white');
		const init = async () => {
			try {
				setIsLoading(true);

				// Используем свойство canEdit из объекта цели вместо отдельного запроса
				if (goal.isCanEdit) {
					setCanEdit(true);
				} else {
					setErrorMessage('Отредактировать цель невозможно. Возможно, прошло более 24 часов с момента создания.');
					setCanEdit(false);
				}

				// Загружаем категории
				const categoriesResponse = await getAllCategories();
				if (categoriesResponse.success) {
					setCategories(categoriesResponse.data);

					// Устанавливаем активную категорию
					if (goal.category) {
						// Определяем, является ли категория цели подкатегорией
						const goalCategory = categoriesResponse.data.find((cat: ICategory) => cat.id === goal.category.id);

						if (goalCategory) {
							if (goalCategory.parentCategory) {
								// Если это подкатегория, находим её родительскую категорию
								const parentCategoryIndex = categoriesResponse.data
									.filter((cat: ICategory) => !cat.parentCategory)
									.findIndex((cat: ICategory) => cat.id === goalCategory.parentCategory?.id);
								if (parentCategoryIndex !== -1) {
									setActiveCategory(parentCategoryIndex);
								}
							} else {
								// Если это родительская категория
								const categoryIndex = categoriesResponse.data
									.filter((cat: ICategory) => !cat.parentCategory)
									.findIndex((cat: ICategory) => cat.id === goal.category.id);
								if (categoryIndex !== -1) {
									setActiveCategory(categoryIndex);
								}
							}
						}
					}

					// Устанавливаем активную сложность
					if (goal.complexity) {
						const complexityIndex = selectComplexity.findIndex((item) => item.value === goal.complexity);
						if (complexityIndex !== -1) {
							setActiveComplexity(complexityIndex);
						}
					}

					// Инициализируем состояния регулярности из goal.regularConfig
					if (goal.regularConfig) {
						setIsRegular(true);

						// Если есть статистика с пользовательскими настройками, используем их
						// Иначе используем базовые настройки из regularConfig
						const userSettings = goal.regularConfig.statistics?.regularGoalData;
						const baseSettings = goal.regularConfig;

						const frequency = userSettings?.frequency || baseSettings.frequency;
						const weeklyFrequencyBase = userSettings?.weeklyFrequency ?? baseSettings.weeklyFrequency ?? 3;

						// Для customSchedule проверяем наличие в userSettings, если есть - используем его
						// Иначе используем baseSettings, иначе дефолтные значения
						let customScheduleBase: WeekDaySchedule;
						if (
							userSettings?.customSchedule &&
							typeof userSettings.customSchedule === 'object' &&
							Object.keys(userSettings.customSchedule).length > 0
						) {
							// Используем пользовательские настройки из статистики
							customScheduleBase = userSettings.customSchedule;
						} else if (
							baseSettings.customSchedule &&
							typeof baseSettings.customSchedule === 'object' &&
							Object.keys(baseSettings.customSchedule).length > 0
						) {
							// Используем базовые настройки из regularConfig
							customScheduleBase = baseSettings.customSchedule;
						} else {
							// Дефолтные значения
							customScheduleBase = {
								monday: false,
								tuesday: false,
								wednesday: false,
								thursday: false,
								friday: false,
								saturday: false,
								sunday: false,
							};
						}

						const durationTypeBase = userSettings?.durationType || baseSettings.durationType;
						const durationValueBase = userSettings?.durationValue ?? baseSettings.durationValue ?? 30;
						const endDate = userSettings?.endDate || baseSettings.endDate || '';
						const allowSkipDaysBase = userSettings?.allowSkipDays ?? baseSettings.allowSkipDays ?? 0;
						const resetOnSkipBase = userSettings?.resetOnSkip ?? baseSettings.resetOnSkip ?? false;

						setRegularFrequency(frequency);
						setWeeklyFrequency(weeklyFrequencyBase);
						setCustomSchedule(customScheduleBase);
						setDurationType(durationTypeBase);
						setDurationValue(durationValueBase);
						setRegularEndDate(endDate);
						setAllowSkipDays(allowSkipDaysBase);
						setResetOnSkip(resetOnSkipBase);
						setAllowCustomSettings(baseSettings.allowCustomSettings ?? true);
					}
				}
			} catch (error) {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: 'Не удалось загрузить данные для редактирования',
				});
				setCanEdit(false);
			} finally {
				setIsLoading(false);
			}
		};

		init();
	}, [goal]);

	// Загрузка подкатегорий при изменении категории
	useEffect(() => {
		if (activeCategory !== null && parentCategories.length > 0 && parentCategories[activeCategory]) {
			const selectedCategory = parentCategories[activeCategory];

			// Фильтруем подкатегории из общего списка категорий
			const filteredSubcategories = categories.filter(
				(cat: ICategory) => cat.parentCategory && cat.parentCategory.id === selectedCategory.id
			);

			setSubcategories(filteredSubcategories);

			// Сбрасываем подкатегорию по умолчанию
			setActiveSubcategory(null);

			// Если у цели есть подкатегория или сама категория является подкатегорией, находим её индекс
			const goalCategory = categories.find((cat: ICategory) => cat.id === goal.category.id);

			if (goalCategory && goalCategory.parentCategory && goalCategory.parentCategory.id === selectedCategory.id) {
				// Цель имеет подкатегорию, которая принадлежит выбранной родительской категории
				const subcategoryIndex = filteredSubcategories.findIndex((sub: ICategory) => sub.id === goalCategory.id);
				if (subcategoryIndex !== -1) {
					setActiveSubcategory(subcategoryIndex);
				}
			} else if (goal.subcategory && filteredSubcategories.length > 0) {
				// У цели есть отдельная подкатегория и в новой категории есть подкатегории
				const subcategoryIndex = filteredSubcategories.findIndex((sub: ICategory) => sub.id === goal.subcategory?.id);
				if (subcategoryIndex !== -1) {
					setActiveSubcategory(subcategoryIndex);
				}
			}
		} else {
			// Если категория не выбрана или у неё нет подкатегорий
			setSubcategories([]);
			setActiveSubcategory(null);
		}
	}, [activeCategory, parentCategories.length, goal.category.id]);

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

	const handleUpdateGoal = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

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
			const formData = new FormData();
			formData.append('title', title);
			formData.append('description', description);

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

			// Если задано предполагаемое время, добавляем его в formData
			if (estimatedTime) {
				const standardTime = convertTimeToStandardFormat(estimatedTime);
				formData.append('estimated_time', standardTime);
			}

			// Добавляем данные о регулярности, если это регулярная цель
			if (isRegular) {
				formData.append('is_regular', 'true');
				formData.append('regular_frequency', regularFrequency);

				if (regularFrequency === 'weekly') {
					formData.append('weekly_frequency', weeklyFrequency.toString());
				}

				if (regularFrequency === 'custom' && customSchedule) {
					formData.append('custom_schedule', JSON.stringify(customSchedule));
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
				formData.append('allow_custom_settings', allowCustomSettings.toString());
			} else if (goal.regularConfig) {
				formData.append('is_regular', 'false');
			}

			const response = await updateGoal(goal.code, formData);

			if (response.success) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Цель успешно обновлена',
				});

				// Если передан обработчик обновления цели, вызываем его
				if (onGoalUpdated && response.data) {
					onGoalUpdated(response.data);
				} else {
					// Возвращаемся к просмотру цели
					navigate(`/goals/${response.data?.code}`);
				}
			} else {
				throw new Error(response.error || 'Неизвестная ошибка');
			}
		} catch (error: unknown) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось обновить цель',
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteGoal = async () => {
		setIsLoading(true);

		try {
			const response = await deleteGoal(goal.code);

			if (response.success) {
				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Цель успешно удалена',
				});

				// Возвращаемся на предыдущую страницу или на домашнюю страницу
				navigate('/');
			} else {
				throw new Error(response.error || 'Неизвестная ошибка');
			}
		} catch (error: unknown) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось удалить цель',
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Обработчик изменения предполагаемого времени
	const handleEstimatedTimeChange = (value: string) => {
		// Используем универсальную функцию валидации времени
		if (validateTimeInput(value)) {
			setEstimatedTime(value);
		}
	};

	return (
		<form className={block()} onSubmit={handleUpdateGoal}>
			<div className={element('wrapper-title')}>
				<Title tag="h1" className={element('title')}>
					Редактирование цели
				</Title>
			</div>
			<Loader isLoading={isLoading}>
				{!canEdit ? (
					<div className={element('error-message')}>
						<Svg icon="error" className={element('error-icon')} />
						<p>{errorMessage || 'Редактирование недоступно'}</p>
						<Button theme="blue" onClick={() => navigate(-1)} type="button">
							Вернуться назад
						</Button>
					</div>
				) : (
					<div className={element('content')}>
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
										withBorder
										onClick={() => {
											setImage(null);
											setImageUrl(null);
										}}
									/>
								</div>
							)}
						</div>
						<div className={element('form')}>
							<FieldInput
								placeholder="Введите название цели"
								id="goal-title"
								text="Название цели *"
								value={title}
								setValue={(value: string) => {
									if (value.length <= GOAL_TITLE_MAX_LENGTH) {
										setTitle(value);
									}
								}}
								className={element('field')}
								required
								maxLength={GOAL_TITLE_MAX_LENGTH}
								showCharCount
							/>

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
								placeholder="Опишите цель подробно"
								id="goal-description"
								text="Описание *"
								value={description}
								setValue={setDescription}
								className={element('field')}
								type="textarea"
								required
								rows={4}
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
									Укажите время: просто число (часы), ЧЧ:ММ (02:30), комбинации (3д5ч, 3д 5ч), или словами (3 дня, 5
									часов, 30 минут)
								</small>
							</div>

							{/* Секция регулярности выполнения */}
							{/* Показываем секцию только если пользователь создатель или может редактировать параметры */}
							{(goal.createdByUser || (goal.regularConfig && goal.regularConfig.allowCustomSettings)) && (
								<div className={element('regular-section')}>
									<FieldCheckbox
										id="is-regular"
										text="Это регулярная цель?"
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
													<div className={element('custom-schedule-selector')}>
														<p className={element('field-title')}>Выберите дни недели</p>
														<WeekDaySelector schedule={customSchedule} onChange={setCustomSchedule} />
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

											{goal.createdByUser && (
												<AllowCustomSettingsField
													checked={allowCustomSettings}
													setChecked={setAllowCustomSettings}
													className={element('field')}
												/>
											)}
										</div>
									)}
								</div>
							)}

							<div className={element('btns-wrapper')}>
								<Button theme="red" className={element('btn')} onClick={() => setIsDeleteModalOpen(true)} type="button">
									Удалить цель
								</Button>
								<Button theme="blue-light" className={element('btn')} onClick={cancelEdit} type="button">
									Отмена
								</Button>
								<Button theme="blue" className={element('btn')} typeBtn="submit">
									Сохранить изменения
								</Button>
							</div>
						</div>
					</div>
				)}
			</Loader>
			<ModalConfirm
				title="Удалить цель?"
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				themeBtn="red"
				handleBtn={handleDeleteGoal}
				textBtn="Удалить цель"
				text="Вы уверены, что хотите удалить эту цель?"
			/>
		</form>
	);
};
